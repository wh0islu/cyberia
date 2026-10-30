
from io import BytesIO
from tempfile import TemporaryDirectory

from apps.base.models import Book, Course, MealEntry, Movie, Series
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class BookApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('base:books_api')

    def test_frontend_multipart_upload_and_collection(self):
        image = BytesIO()
        Image.new('RGB', (2, 2)).save(image, format='PNG')
        with TemporaryDirectory() as media_root, self.settings(MEDIA_ROOT=media_root):
            response = self.client.post(self.list_url, {
                'title': 'My book', 'author': 'Author', 'genre': 'FI',
                'number_of_pages': '200', 'current_page': '12', 'status': 'RE',
                'started_on': '2026-10-28', 'notes': 'Notes',
                'cover': SimpleUploadedFile('cover.png', image.getvalue(), content_type='image/png'),
                'sources[0]format': 'PH', 'sources[0]location': 'Shelf',
                'sources[1]format': 'WEB', 'sources[1]url': 'https://example.com/book',
            }, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
            book = Book.objects.get()
            self.assertEqual(book.sources.count(), 2)
            listing = self.client.get(self.list_url)
            self.assertEqual(listing.data[0]['number_of_pages'], 200)
            self.assertEqual(listing.data[0]['sources'][0]['location'], 'Shelf')
            self.assertTrue(listing.data[0]['cover'].startswith('http://testserver/media/'))
            self.assertIn('csrftoken', listing.cookies)

    def test_progress_cannot_exceed_total_pages(self):
        book = Book.objects.create(title='Book', author='Author', number_of_pages=100)
        response = self.client.patch(reverse('base:book_api', args=[book.pk]),
                                     {'current_page': 101}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        book.refresh_from_db()
        self.assertEqual(book.current_page, 0)

    def test_session_authenticated_frontend_can_post_with_csrf(self):
        user = User.objects.create_user(username='reader', password='test-password')
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(user)
        client.get(self.list_url)
        response = client.post(self.list_url, {'title': 'Book', 'author': 'Author'},
                               format='multipart',
                               HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
                               HTTP_ORIGIN='http://localhost:5173')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_post_creates_book_on_collection_endpoint(self):
        response = self.client.post(
            self.list_url,
            {
                'title': 'Clean Code',
                'author': 'Robert C. Martin',
                'number_of_pages': 464,
                'current_page': 0,
                'status': 'RE',
                'language': 'EN',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Book.objects.count(), 1)
        self.assertEqual(Book.objects.get().title, 'Clean Code')

    def test_post_requires_book_title_and_author(self):
        response = self.client.post(self.list_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Book.objects.count(), 0)

    def test_patch_updates_only_sent_fields(self):
        book = Book.objects.create(
            title='Clean Code',
            author='Robert C. Martin',
            number_of_pages=464,
            current_page=10,
        )

        response = self.client.patch(
            reverse('base:book_api', args=[book.pk]),
            {'current_page': 120},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        book.refresh_from_db()
        self.assertEqual(book.current_page, 120)
        self.assertEqual(book.title, 'Clean Code')

    def test_delete_removes_book(self):
        book = Book.objects.create(title='Clean Code', author='Robert C. Martin')

        response = self.client.delete(reverse('base:book_api', args=[book.pk]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(pk=book.pk).exists())

    def test_detail_methods_return_not_found_for_missing_book(self):
        response = self.client.patch(
            reverse('base:book_api', args=[99999]),
            {'current_page': 120},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CourseApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('base:courses_api')

    def test_frontend_multipart_payload_creates_course(self):
        response = self.client.post(
            self.list_url,
            {
                'title': 'Django REST Framework',
                'instructor': 'Example Instructor',
                'platform': 'Udemy',
                'status': 'IP',
                'number_of_lessons': '40',
                'completed_lessons': '8',
                'goal_date': '2026-12-01',
                'certificate_available': 'true',
                'modules': '["Serializers", "ViewSets"]',
                'sources': '[{"format":"WEB","location":null,"url":"https://example.com/course"}]',
            },
            format='multipart',
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        course = Course.objects.get()
        assert course.modules == ['Serializers', 'ViewSets']
        assert course.certificate_available
        assert course.sources.get().url == 'https://example.com/course'

    def test_detail_panel_fields_can_be_patched_without_losing_course_data(self):
        completed_lessons = 4
        course = Course.objects.create(
            title='Python course',
            status='IP',
            number_of_lessons=20,
            completed_lessons=completed_lessons,
        )

        response = self.client.patch(
            reverse('base:course_api', args=[course.pk]),
            {'goal_date': '2026-11-30', 'certificate_available': True},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        course.refresh_from_db()
        assert course.goal_date.isoformat() == '2026-11-30'
        assert course.certificate_available
        assert course.title == 'Python course'
        assert course.completed_lessons == completed_lessons

    def test_completed_lessons_cannot_exceed_total(self):
        course = Course.objects.create(title='Course', number_of_lessons=10)

        response = self.client.patch(
            reverse('base:course_api', args=[course.pk]),
            {'completed_lessons': 11},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        course.refresh_from_db()
        assert course.completed_lessons == 0


class MealApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='meal-user', password='test-password')
        self.client.force_authenticate(self.user)
        self.list_url = reverse('base:meals_api')

    def test_frontend_multipart_payload_creates_meal_with_items_and_tags(self):
        response = self.client.post(
            self.list_url,
            {
                'category': 'BR',
                'date': '2026-10-30',
                'time': '07:15',
                'tags': '["home", "quick"]',
                'items': '[{"name":"Coffee"},{"name":"Papaya"}]',
            },
            format='multipart',
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        meal = MealEntry.objects.get()
        assert meal.user == self.user
        assert meal.tags == ['home', 'quick']
        assert list(meal.items.values_list('name', flat=True)) == ['Coffee', 'Papaya']

    def test_frontend_multipart_patch_replaces_items_and_clears_tags(self):
        meal = MealEntry.objects.create(
            user=self.user,
            category='LU',
            date='2026-10-30',
            tags=['home'],
        )
        meal.items.create(name='Rice')

        response = self.client.patch(
            reverse('base:meal_api', args=[meal.pk]),
            {
                'category': 'LU',
                'date': '2026-10-30',
                'time': '',
                'tags': '[]',
                'items': '[{"name":"Rice and beans"}]',
            },
            format='multipart',
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        meal.refresh_from_db()
        assert meal.time is None
        assert meal.tags == []
        assert list(meal.items.values_list('name', flat=True)) == ['Rice and beans']

    def test_photo_can_be_uploaded_directly_without_resending_meal_fields(self):
        meal = MealEntry.objects.create(
            user=self.user,
            category='BR',
            date='2026-10-30',
        )
        image = BytesIO()
        Image.new('RGB', (2, 2)).save(image, format='PNG')

        with TemporaryDirectory() as media_root, self.settings(MEDIA_ROOT=media_root):
            response = self.client.patch(
                reverse('base:meal_api', args=[meal.pk]),
                {'photo': SimpleUploadedFile('meal.png', image.getvalue(), content_type='image/png')},
                format='multipart',
            )

            assert response.status_code == status.HTTP_200_OK, response.data
            meal.refresh_from_db()
            assert meal.photo.name.startswith('meals/photos/meal')
            assert meal.category == 'BR'


class MediaSynopsisApiTests(APITestCase):
    def test_movie_synopsis_is_saved_and_returned(self):
        response = self.client.post(
            reverse('base:movies_api'),
            {'title': 'Example movie', 'status': 'NW', 'tmdb_id': 42,
             'tmdb_synopsis': 'A saved movie synopsis.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Movie.objects.get().tmdb_synopsis, 'A saved movie synopsis.')
        detail = self.client.get(reverse('base:movie_api', args=[response.data['id']]))
        self.assertEqual(detail.data['tmdb_synopsis'], 'A saved movie synopsis.')

    def test_series_synopsis_can_be_added_to_existing_record(self):
        series = Series.objects.create(title='Example series')
        self.assertEqual(series.tmdb_synopsis, '')

        response = self.client.patch(
            reverse('base:series_detail_api', args=[series.pk]),
            {'tmdb_synopsis': 'A saved series synopsis.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        series.refresh_from_db()
        self.assertEqual(series.tmdb_synopsis, 'A saved series synopsis.')
        self.assertEqual(response.data['tmdb_synopsis'], 'A saved series synopsis.')


from io import BytesIO
from tempfile import TemporaryDirectory

from PIL import Image
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.base.models import Book
from django.urls import reverse
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

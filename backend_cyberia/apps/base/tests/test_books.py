from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.base.models import Book


class BookApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('base:books_api')

    def test_frontend_multipart_upload_and_collection(self):
        number_of_pages = 200
        source_count = 2
        image = BytesIO()
        Image.new('RGB', (2, 2)).save(image, format='PNG')
        with TemporaryDirectory() as media_root, self.settings(MEDIA_ROOT=media_root):
            response = self.client.post(
                self.list_url,
                {
                    'title': 'My book',
                    'author': 'Author',
                    'genre': 'FI',
                    'number_of_pages': str(number_of_pages),
                    'current_page': '12',
                    'status': 'RE',
                    'started_on': '2026-10-28',
                    'notes': 'Notes',
                    'cover': SimpleUploadedFile('cover.png', image.getvalue(), content_type='image/png'),
                    'sources[0]format': 'PH',
                    'sources[0]location': 'Shelf',
                    'sources[1]format': 'WEB',
                    'sources[1]url': 'https://example.com/book',
                },
                format='multipart',
            )
            assert response.status_code == status.HTTP_201_CREATED, response.data
            book = Book.objects.get()
            assert book.sources.count() == source_count
            listing = self.client.get(self.list_url)
            assert listing.data[0]['number_of_pages'] == number_of_pages
            assert listing.data[0]['sources'][0]['location'] == 'Shelf'
            assert listing.data[0]['cover'].startswith('http://testserver/media/')
            assert 'csrftoken' in listing.cookies

    def test_progress_cannot_exceed_total_pages(self):
        book = Book.objects.create(title='Book', author='Author', number_of_pages=100)
        response = self.client.patch(reverse('base:book_api', args=[book.pk]), {'current_page': 101}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        book.refresh_from_db()
        assert book.current_page == 0

    def test_browser_can_post_with_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get(self.list_url)
        response = client.post(
            self.list_url,
            {'title': 'Book', 'author': 'Author'},
            format='multipart',
            HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
            HTTP_ORIGIN='http://localhost:5173',
        )
        assert response.status_code == status.HTTP_201_CREATED, response.data

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

        assert response.status_code == status.HTTP_201_CREATED
        assert Book.objects.count() == 1
        assert Book.objects.get().title == 'Clean Code'

    def test_post_requires_book_title_and_author(self):
        response = self.client.post(self.list_url, {}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Book.objects.count() == 0

    def test_patch_updates_only_sent_fields(self):
        current_page = 120
        book = Book.objects.create(
            title='Clean Code',
            author='Robert C. Martin',
            number_of_pages=464,
            current_page=10,
        )

        response = self.client.patch(
            reverse('base:book_api', args=[book.pk]),
            {'current_page': current_page},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        book.refresh_from_db()
        assert book.current_page == current_page
        assert book.title == 'Clean Code'

    def test_delete_removes_book(self):
        book = Book.objects.create(title='Clean Code', author='Robert C. Martin')

        response = self.client.delete(reverse('base:book_api', args=[book.pk]))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Book.objects.filter(pk=book.pk).exists()

    def test_detail_methods_return_not_found_for_missing_book(self):
        response = self.client.patch(
            reverse('base:book_api', args=[99999]),
            {'current_page': 120},
            format='json',
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

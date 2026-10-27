
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.models import Book


class BookApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('base:books_api')

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

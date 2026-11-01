from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.models import MealEntry


class MealApiTests(APITestCase):
    def setUp(self):
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
        assert meal.tags == ['home', 'quick']
        assert list(meal.items.values_list('name', flat=True)) == ['Coffee', 'Papaya']

    def test_frontend_multipart_patch_replaces_items_and_clears_tags(self):
        meal = MealEntry.objects.create(
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

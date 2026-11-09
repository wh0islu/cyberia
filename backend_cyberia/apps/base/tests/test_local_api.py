from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.base.models import Habit, HabitCompletion, MealEntry, MealNote


class LocalApiTests(APITestCase):
    def test_anonymous_client_can_create_edit_and_delete_local_items(self):
        meal = self.client.post(
            reverse('base:meals_api'),
            {'category': 'LU', 'date': '2026-11-01', 'items': [{'name': 'Rice'}]},
            format='json',
        )
        assert meal.status_code == status.HTTP_201_CREATED, meal.data
        habit = self.client.post(
            reverse('base:habits_api'),
            {'name': 'Read', 'weekdays': [0]},
            format='json',
        )
        assert habit.status_code == status.HTTP_201_CREATED, habit.data
        completion = self.client.post(
            reverse('base:habit_completions_api'),
            {'habit': habit.data['id'], 'date': '2026-11-01', 'completed': True},
            format='json',
        )
        assert completion.status_code == status.HTTP_201_CREATED, completion.data

        for list_route, detail_route, item_id, changes in [
            ('meals_api', 'meal_api', meal.data['id'], {'category': 'DI'}),
            ('habits_api', 'habit_api', habit.data['id'], {'name': 'Study'}),
            ('habit_completions_api', 'habit_completion_api', completion.data['id'], {'completed': False}),
        ]:
            with self.subTest(route=list_route):
                listing = self.client.get(reverse(f'base:{list_route}'))
                assert listing.status_code == status.HTTP_200_OK
                assert [item['id'] for item in listing.data] == [item_id]
                updated = self.client.patch(reverse(f'base:{detail_route}', args=[item_id]), changes, format='json')
                assert updated.status_code == status.HTTP_200_OK

        for route, item_id in [('meal_api', meal.data['id']), ('habit_api', habit.data['id'])]:
            response = self.client.delete(reverse(f'base:{route}', args=[item_id]))
            assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not MealEntry.objects.exists()
        assert not Habit.objects.exists()
        assert not HabitCompletion.objects.exists()

    @staticmethod
    def test_anonymous_writes_require_csrf():
        client = APIClient(enforce_csrf_checks=True)
        url = reverse('base:habits_api')
        listing = client.get(url)
        assert listing.status_code == status.HTTP_200_OK
        assert 'csrftoken' in listing.cookies
        missing_token = client.post(url, {'name': 'Read', 'weekdays': [0]}, format='json')
        assert missing_token.status_code == status.HTTP_403_FORBIDDEN
        valid = client.post(
            url,
            {'name': 'Read', 'weekdays': [0]},
            format='json',
            HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
        )
        assert valid.status_code == status.HTTP_201_CREATED, valid.data
        cross_origin = client.post(
            url,
            {'name': 'Study', 'weekdays': [1]},
            format='json',
            HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
            HTTP_ORIGIN='https://untrusted.example',
        )
        assert cross_origin.status_code == status.HTTP_403_FORBIDDEN

    def test_all_collections_reject_anonymous_writes_without_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        for route in ('books_api', 'movies_api', 'series_api', 'courses_api', 'meals_api', 'meal_notes_api'):
            with self.subTest(route=route):
                response = client.post(reverse(f'base:{route}'), {}, format='json')
                assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_meal_notes_are_created_and_updated_by_date(self):
        url = reverse('base:meal_notes_api')
        saved = self.client.post(url, {'date': '2026-11-01', 'text': 'Drank enough water.'}, format='json')
        assert saved.status_code == status.HTTP_200_OK, saved.data
        updated = self.client.post(url, {'date': '2026-11-01', 'text': 'Added an evening snack.'}, format='json')
        assert updated.status_code == status.HTTP_200_OK, updated.data
        assert MealNote.objects.count() == 1
        assert MealNote.objects.get().text == 'Added an evening snack.'
        assert self.client.get(url).data[0]['text'] == 'Added an evening snack.'

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.models import Movie, Series


class MediaSynopsisApiTests(APITestCase):
    def test_movie_synopsis_is_saved_and_returned(self):
        response = self.client.post(
            reverse('base:movies_api'),
            {'title': 'Example movie', 'status': 'NW', 'tmdb_id': 42, 'tmdb_synopsis': 'A saved movie synopsis.'},
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert Movie.objects.get().tmdb_synopsis == 'A saved movie synopsis.'
        detail = self.client.get(reverse('base:movie_api', args=[response.data['id']]))
        assert detail.data['tmdb_synopsis'] == 'A saved movie synopsis.'

    def test_series_synopsis_can_be_added_to_existing_record(self):
        series = Series.objects.create(title='Example series')
        assert not series.tmdb_synopsis

        response = self.client.patch(
            reverse('base:series_detail_api', args=[series.pk]),
            {'tmdb_synopsis': 'A saved series synopsis.'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        series.refresh_from_db()
        assert series.tmdb_synopsis == 'A saved series synopsis.'
        assert response.data['tmdb_synopsis'] == 'A saved series synopsis.'

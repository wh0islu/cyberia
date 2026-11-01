import json
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@override_settings(TMDB_ACCESS_TOKEN='example-token')
class TmdbErrorTests(SimpleTestCase):
    def test_error_responses_are_preserved(self):
        client = APIClient()
        url = reverse('base:tmdb_media_details', args=['movie', 1])
        cases = [
            (
                HTTPError(url, status.HTTP_404_NOT_FOUND, 'Missing', None, None),
                status.HTTP_404_NOT_FOUND,
                'TMDB could not find this title.',
            ),
            (
                HTTPError(url, status.HTTP_503_SERVICE_UNAVAILABLE, 'Unavailable', None, None),
                status.HTTP_502_BAD_GATEWAY,
                'Could not reach TMDB right now.',
            ),
            (URLError('Offline'), status.HTTP_502_BAD_GATEWAY, 'Could not reach TMDB right now.'),
            (TimeoutError(), status.HTTP_502_BAD_GATEWAY, 'Could not reach TMDB right now.'),
            (json.JSONDecodeError('Invalid', '', 0), status.HTTP_502_BAD_GATEWAY, 'TMDB returned an invalid response.'),
            (
                UnicodeDecodeError('utf-8', b'\xff', 0, 1, 'Invalid'),
                status.HTTP_502_BAD_GATEWAY,
                'TMDB returned an invalid response.',
            ),
        ]
        for error, expected_status, detail in cases:
            with self.subTest(error=type(error).__name__):
                cache.clear()
                with patch('apps.base.api.tmdb.urlopen', side_effect=error):
                    response = client.get(url)
                assert response.status_code == expected_status
                assert response.data == {'detail': detail}

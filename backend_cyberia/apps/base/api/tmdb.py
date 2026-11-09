import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

TMDB_MIN_QUERY_LENGTH = 2


def _get_tmdb_genres(media_type):
    cache_key = f'tmdb_genres_{media_type}_en'
    cached_genres = cache.get(cache_key)
    if cached_genres is not None:
        return cached_genres

    endpoint = 'tv' if media_type == 'series' else 'movie'
    tmdb_url = f'https://api.themoviedb.org/3/genre/{endpoint}/list?language=en-US'
    tmdb_request = Request(
        tmdb_url,
        headers={
            'Accept': 'application/json',
            'Authorization': f'Bearer {settings.TMDB_ACCESS_TOKEN}',
        },
    )

    try:
        with urlopen(tmdb_request, timeout=5) as response:
            payload = json.load(response)
    except HTTPError, URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError:
        return {}

    genres = {genre['id']: genre['name'] for genre in payload.get('genres', []) if 'id' in genre and 'name' in genre}
    cache.set(cache_key, genres, timeout=60 * 60 * 24)
    return genres


@api_view(http_method_names=['GET'])
def tmdb_media_search(request):
    query = request.query_params.get('query', '').strip()
    media_type = request.query_params.get('type', '').strip()

    if len(query) < TMDB_MIN_QUERY_LENGTH:
        return Response({'results': []})

    if media_type not in {'movie', 'series'}:
        return Response(
            {'detail': 'Type must be either "movie" or "series".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.TMDB_ACCESS_TOKEN:
        return Response(
            {'detail': 'TMDB search is not configured on the server.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    endpoint = 'tv' if media_type == 'series' else 'movie'
    query_string = urlencode({'query': query, 'language': 'en-US', 'include_adult': 'false'})
    tmdb_url = f'https://api.themoviedb.org/3/search/{endpoint}?{query_string}'
    tmdb_request = Request(
        tmdb_url,
        headers={
            'Accept': 'application/json',
            'Authorization': f'Bearer {settings.TMDB_ACCESS_TOKEN}',
        },
    )

    try:
        with urlopen(tmdb_request, timeout=5) as response:
            payload = json.load(response)
    except HTTPError, URLError, TimeoutError:
        return Response(
            {'detail': 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except json.JSONDecodeError, UnicodeDecodeError:
        return Response(
            {'detail': 'TMDB returned an invalid response.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    genre_names_by_id = _get_tmdb_genres(media_type)
    results = []
    for item in payload.get('results', [])[:8]:
        title = item.get('title') or item.get('name')
        release_date = item.get('release_date') or item.get('first_air_date') or ''
        poster_path = item.get('poster_path')

        if not title:
            continue

        genres = [
            genre_names_by_id[genre_id] for genre_id in item.get('genre_ids', []) if genre_id in genre_names_by_id
        ]
        results.append({
            'tmdb_id': item['id'],
            'title': title,
            'year': release_date[:4] or None,
            'tmdb_poster_path': poster_path,
            'poster_url': (f'https://image.tmdb.org/t/p/w500{poster_path}' if poster_path else None),
            'genres': genres,
            'overview': item.get('overview', ''),
        })

    return Response({'results': results})


@api_view(http_method_names=['GET'])
def tmdb_series_details(request, tmdb_id):
    if not settings.TMDB_ACCESS_TOKEN:
        return Response(
            {'detail': 'TMDB search is not configured on the server.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    cached_details = cache.get(f'tmdb_series_details_{tmdb_id}_en')
    if cached_details is not None:
        return Response(cached_details)

    tmdb_url = f'https://api.themoviedb.org/3/tv/{tmdb_id}?language=en-US'
    tmdb_request = Request(
        tmdb_url,
        headers={
            'Accept': 'application/json',
            'Authorization': f'Bearer {settings.TMDB_ACCESS_TOKEN}',
        },
    )

    try:
        with urlopen(tmdb_request, timeout=5) as response:
            payload = json.load(response)
    except HTTPError, URLError, TimeoutError:
        return Response(
            {'detail': 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except json.JSONDecodeError, UnicodeDecodeError:
        return Response(
            {'detail': 'TMDB returned an invalid response.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    seasons = [
        {
            'number': season['season_number'],
            'episode_count': season.get('episode_count') or 0,
        }
        for season in payload.get('seasons', [])
        if season.get('season_number', 0) > 0
    ]
    details = {
        'tmdb_id': tmdb_id,
        'number_of_seasons': payload.get('number_of_seasons') or len(seasons),
        'number_of_episodes': payload.get('number_of_episodes') or sum(season['episode_count'] for season in seasons),
        'seasons': seasons,
    }
    cache.set(f'tmdb_series_details_{tmdb_id}_en', details, timeout=60 * 60 * 24)
    return Response(details)


@api_view(http_method_names=['GET'])
def tmdb_media_details(request, media_type, tmdb_id):
    if media_type not in {'movie', 'series'}:
        return Response(
            {'detail': 'Type must be either "movie" or "series".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.TMDB_ACCESS_TOKEN:
        return Response(
            {'detail': 'TMDB search is not configured on the server.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    cache_key = f'tmdb_media_details_{media_type}_{tmdb_id}_en'
    cached_details = cache.get(cache_key)
    if cached_details is not None:
        return Response(cached_details)

    endpoint = 'tv' if media_type == 'series' else 'movie'
    tmdb_url = f'https://api.themoviedb.org/3/{endpoint}/{tmdb_id}?language=en-US'
    tmdb_request = Request(
        tmdb_url,
        headers={
            'Accept': 'application/json',
            'Authorization': f'Bearer {settings.TMDB_ACCESS_TOKEN}',
        },
    )

    try:
        with urlopen(tmdb_request, timeout=5) as response:
            payload = json.load(response)
    except HTTPError as error:
        not_found = error.code == status.HTTP_404_NOT_FOUND
        response_status = status.HTTP_404_NOT_FOUND if not_found else status.HTTP_502_BAD_GATEWAY
        return Response(
            {'detail': 'TMDB could not find this title.' if not_found else 'Could not reach TMDB right now.'},
            status=response_status,
        )
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        invalid_response = isinstance(error, (json.JSONDecodeError, UnicodeDecodeError))
        return Response(
            {'detail': 'TMDB returned an invalid response.' if invalid_response else 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    poster_path = payload.get('poster_path')
    release_date = payload.get('release_date') or payload.get('first_air_date') or ''
    seasons = [
        {
            'number': season['season_number'],
            'episode_count': season.get('episode_count') or 0,
        }
        for season in payload.get('seasons', [])
        if season.get('season_number', 0) > 0
    ]
    details = {
        'tmdb_id': tmdb_id,
        'kind': media_type,
        'title': payload.get('title') or payload.get('name') or '',
        'year': release_date[:4] or None,
        'genres': [genre['name'] for genre in payload.get('genres', []) if genre.get('name')],
        'overview': payload.get('overview') or '',
        'poster_url': (f'https://image.tmdb.org/t/p/w500{poster_path}' if poster_path else None),
        'runtime': payload.get('runtime'),
        'number_of_seasons': payload.get('number_of_seasons'),
        'number_of_episodes': payload.get('number_of_episodes'),
        'seasons': seasons,
    }
    cache.set(cache_key, details, timeout=60 * 60 * 24)
    return Response(details)

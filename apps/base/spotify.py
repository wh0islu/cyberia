import base64
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.cache import cache

TOKEN_URL = 'https://accounts.spotify.com/api/token'
NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'
RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played'
TOKEN_CACHE_KEY = 'spotify_access_token'
NOW_PLAYING_CACHE_KEY = 'spotify_now_playing'
RECENTLY_PLAYED_CACHE_KEY = 'spotify_recently_played'
NOW_PLAYING_TTL = 5
RECENTLY_PLAYED_TTL = 30
TIMEOUT = 5
HTTP_NO_CONTENT = 204


def _basic_auth_header():
    raw = f'{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}'
    return 'Basic ' + base64.b64encode(raw.encode()).decode()


def _post_token(data):
    request = urllib.request.Request(
        TOKEN_URL,
        data=urllib.parse.urlencode(data).encode(),
        headers={'Authorization': _basic_auth_header()},
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return json.load(response)


def exchange_code(code, redirect_uri):
    """Troca o authorization code pelos tokens (usado uma vez, pelo comando spotify_token)."""
    return _post_token({'grant_type': 'authorization_code', 'code': code, 'redirect_uri': redirect_uri})


def get_access_token():
    token = cache.get(TOKEN_CACHE_KEY)
    if token:
        return token

    payload = _post_token({'grant_type': 'refresh_token', 'refresh_token': settings.SPOTIFY_REFRESH_TOKEN})
    token = payload['access_token']
    cache.set(TOKEN_CACHE_KEY, token, payload.get('expires_in', 3600) - 60)
    return token


def get_now_playing():
    """Retorna um dict simples para o front-end; nunca levanta erro de rede."""
    cached = cache.get(NOW_PLAYING_CACHE_KEY)
    if cached is not None:
        return cached

    result = _fetch_now_playing()
    cache.set(NOW_PLAYING_CACHE_KEY, result, NOW_PLAYING_TTL)
    return result


def get_recently_played(limit=5):
    cached = cache.get(RECENTLY_PLAYED_CACHE_KEY)
    if cached is not None:
        return cached

    result = _fetch_recently_played(limit)
    cache.set(RECENTLY_PLAYED_CACHE_KEY, result, RECENTLY_PLAYED_TTL)
    return result


def _fetch_recently_played(limit):
    if not settings.SPOTIFY_REFRESH_TOKEN:
        return []

    try:
        query = urllib.parse.urlencode({'limit': limit})
        request = urllib.request.Request(
            f'{RECENTLY_PLAYED_URL}?{query}',
            headers={'Authorization': f'Bearer {get_access_token()}'},
        )
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            data = json.load(response)
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError):
        return []

    tracks = []
    for item in data.get('items', []):
        track = item.get('track') or {}
        album = track.get('album') or {}
        images = album.get('images') or []
        external_urls = track.get('external_urls') or {}

        tracks.append({
            'title': track.get('name', 'Música desconhecida'),
            'artists': ', '.join(artist.get('name', '') for artist in track.get('artists', [])),
            'album': album.get('name', ''),
            'cover': images[0].get('url') if images else None,
            'url': external_urls.get('spotify'),
            'played_at': item.get('played_at'),
        })

    return tracks


def _fetch_now_playing():
    nothing = {'is_playing': False}
    if not settings.SPOTIFY_REFRESH_TOKEN:
        return nothing

    try:
        request = urllib.request.Request(NOW_PLAYING_URL, headers={'Authorization': f'Bearer {get_access_token()}'})
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            if response.status == HTTP_NO_CONTENT:
                return nothing
            data = json.load(response)
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError):
        return nothing

    item = data.get('item')
    if not data.get('is_playing') or not item or item.get('type') != 'track':
        return nothing

    images = item['album']['images']
    return {
        'is_playing': True,
        'title': item['name'],
        'artists': ', '.join(artist['name'] for artist in item['artists']),
        'album': item['album']['name'],
        'cover': images[0]['url'] if images else None,
        'url': item['external_urls'].get('spotify'),
    }

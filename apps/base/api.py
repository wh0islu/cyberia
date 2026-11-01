import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from apps.base.models import (
    Book,
    Course,
    Habit,
    HabitCompletion,
    MealEntry,
    Movie,
    Series,
)
from apps.base.serializers import (
    BookSerializer,
    BooksSerializer,
    CourseSerializer,
    HabitCompletionSerializer,
    HabitSerializer,
    MealEntrySerializer,
    MovieSerializer,
    SeriesSerializer,
)
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response



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
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError):
        return {}

    genres = {
        genre['id']: genre['name']
        for genre in payload.get('genres', [])
        if 'id' in genre and 'name' in genre
    }
    cache.set(cache_key, genres, timeout=60 * 60 * 24)
    return genres


@api_view(http_method_names=['GET'])
def tmdb_media_search(request):
    query = request.query_params.get('query', '').strip()
    media_type = request.query_params.get('type', '').strip()

    if len(query) < 2:
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
    except (HTTPError, URLError, TimeoutError):
        return Response(
            {'detail': 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except (json.JSONDecodeError, UnicodeDecodeError):
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
            genre_names_by_id[genre_id]
            for genre_id in item.get('genre_ids', [])
            if genre_id in genre_names_by_id
        ]
        results.append({
            'tmdb_id': item['id'],
            'title': title,
            'year': release_date[:4] or None,
            'tmdb_poster_path': poster_path,
            'poster_url': (
                f'https://image.tmdb.org/t/p/w500{poster_path}' if poster_path else None
            ),
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
    except (HTTPError, URLError, TimeoutError):
        return Response(
            {'detail': 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except (json.JSONDecodeError, UnicodeDecodeError):
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
        'number_of_episodes': payload.get('number_of_episodes') or sum(
            season['episode_count'] for season in seasons
        ),
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
        response_status = (
            status.HTTP_404_NOT_FOUND
            if error.code == 404
            else status.HTTP_502_BAD_GATEWAY
        )
        return Response(
            {'detail': 'TMDB could not find this title.' if error.code == 404 else 'Could not reach TMDB right now.'},
            status=response_status,
        )
    except (URLError, TimeoutError):
        return Response(
            {'detail': 'Could not reach TMDB right now.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except (json.JSONDecodeError, UnicodeDecodeError):
        return Response(
            {'detail': 'TMDB returned an invalid response.'},
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
        'poster_url': (
            f'https://image.tmdb.org/t/p/w500{poster_path}' if poster_path else None
        ),
        'runtime': payload.get('runtime'),
        'number_of_seasons': payload.get('number_of_seasons'),
        'number_of_episodes': payload.get('number_of_episodes'),
        'seasons': seasons,
    }
    cache.set(cache_key, details, timeout=60 * 60 * 24)
    return Response(details)



@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def books_api_collection(request):
    if request.method == 'GET':
        books = Book.objects.prefetch_related('sources').all()
        serializer = BooksSerializer(instance=books, many=True, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BookSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def book_api(request, pk):
    book = get_object_or_404(Book.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = BookSerializer(instance=book, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = BookSerializer(
            instance=book,
            data=request.data,
            context={'request': request},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



def _media_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    sources = data.get('sources')
    if isinstance(sources, str):
        try:
            data['sources'] = json.loads(sources)
        except json.JSONDecodeError:
            pass
    return data


@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def movies_api_collection(request):
    if request.method == 'GET':
        serializer = MovieSerializer(Movie.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MovieSerializer(data=_media_request_data(request), context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def movie_api(request, pk):
    movie = get_object_or_404(Movie.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = MovieSerializer(movie, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MovieSerializer(
            movie,
            data=_media_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        movie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def series_api_collection(request):
    if request.method == 'GET':
        serializer = SeriesSerializer(Series.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SeriesSerializer(data=_media_request_data(request), context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def series_api(request, pk):
    series = get_object_or_404(Series.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = SeriesSerializer(series, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = SeriesSerializer(
            series,
            data=_media_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        series.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



def _meal_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    if 'time' in data and not data['time']:
        data['time'] = None
    for field in ('tags', 'items'):
        value = data.get(field)
        if isinstance(value, str):
            try:
                data[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return data


@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meals_api_collection(request):
    if request.method == 'GET':
        meals = MealEntry.objects.filter(user=request.user).prefetch_related('items')
        serializer = MealEntrySerializer(meals, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MealEntrySerializer(data=_meal_request_data(request), context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def meal_api(request, pk):
    meal = get_object_or_404(
        MealEntry.objects.filter(user=request.user).prefetch_related('items'),
        pk=pk,
    )

    if request.method == 'GET':
        serializer = MealEntrySerializer(meal, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MealEntrySerializer(
            meal,
            data=_meal_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        meal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



def _course_request_data(request):
    data = {key: request.data.get(key) for key in request.data}
    if data.get('goal_date') == '':
        data['goal_date'] = None
    for field in ('sources', 'modules'):
        value = data.get(field)
        if isinstance(value, str):
            try:
                data[field] = json.loads(value)
            except json.JSONDecodeError:
                pass
    return data


@api_view(http_method_names=['GET', 'POST'])
def courses_api_collection(request):
    if request.method == 'GET':
        serializer = CourseSerializer(Course.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CourseSerializer(data=_course_request_data(request), context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def course_api(request, pk):
    course = get_object_or_404(Course.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = CourseSerializer(course, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = CourseSerializer(
            course,
            data=_course_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habits_api_collection(request):
    if request.method == 'GET':
        habits = Habit.objects.filter(user=request.user).prefetch_related('completions')
        serializer = HabitSerializer(habits, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HabitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        habit = serializer.save(user=request.user)
        return Response(HabitSerializer(habit).data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_api(request, pk):
    habit = get_object_or_404(
        Habit.objects.filter(user=request.user).prefetch_related('completions'),
        pk=pk,
    )

    if request.method == 'GET':
        return Response(HabitSerializer(habit).data)

    elif request.method == 'PATCH':
        serializer = HabitSerializer(
            habit,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return Response(HabitSerializer(habit).data)

    elif request.method == 'DELETE':
        habit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habit_completions_api_collection(request):
    if request.method == 'GET':
        completions = HabitCompletion.objects.filter(
            habit__user=request.user,
        ).select_related('habit')
        serializer = HabitCompletionSerializer(completions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HabitCompletionSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        completion = serializer.save()
        return Response(
            HabitCompletionSerializer(completion).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_completion_api(request, pk):
    completion = get_object_or_404(
        HabitCompletion.objects.filter(habit__user=request.user).select_related('habit'),
        pk=pk,
    )

    if request.method == 'GET':
        return Response(HabitCompletionSerializer(completion).data)

    elif request.method == 'PATCH':
        serializer = HabitCompletionSerializer(
            completion,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        completion = serializer.save()
        return Response(HabitCompletionSerializer(completion).data)

    elif request.method == 'DELETE':
        completion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

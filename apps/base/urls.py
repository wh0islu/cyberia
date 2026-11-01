from django.urls import path

from . import api

app_name = 'base'
urlpatterns = [
    # Books
    path('api/v1/books/', api.books_api_collection, name='books_api'),
    path('api/v1/books/<int:pk>/', api.book_api, name='book_api'),
    # Movies
    path('api/v1/media-search/', api.tmdb_media_search, name='tmdb_media_search'),
    path(
        'api/v1/tmdb/<str:media_type>/<int:tmdb_id>/',
        api.tmdb_media_details,
        name='tmdb_media_details',
    ),
    path('api/v1/movies/', api.movies_api_collection, name='movies_api'),
    path('api/v1/movies/<int:pk>/', api.movie_api, name='movie_api'),
    # Series
    path(
        'api/v1/tmdb/series/<int:tmdb_id>/',
        api.tmdb_series_details,
        name='tmdb_series_details',
    ),
    path('api/v1/series/', api.series_api_collection, name='series_api'),
    path('api/v1/series/<int:pk>/', api.series_api, name='series_detail_api'),
    # Meals
    path('api/v1/meals/', api.meals_api_collection, name='meals_api'),
    path('api/v1/meals/<int:pk>/', api.meal_api, name='meal_api'),
    # Courses
    path('api/v1/courses/', api.courses_api_collection, name='courses_api'),
    path('api/v1/courses/<int:pk>/', api.course_api, name='course_api'),
    # Routine
    path('api/v1/habits/', api.habits_api_collection, name='habits_api'),
    path('api/v1/habits/<int:pk>/', api.habit_api, name='habit_api'),
    path(
        'api/v1/habit-completions/',
        api.habit_completions_api_collection,
        name='habit_completions_api',
    ),
    path(
        'api/v1/habit-completions/<int:pk>/',
        api.habit_completion_api,
        name='habit_completion_api',
    ),
]

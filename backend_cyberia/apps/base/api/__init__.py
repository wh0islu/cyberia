from .books import book_api, books_api_collection
from .courses import course_api, courses_api_collection
from .meals import meal_api, meal_notes_api_collection, meals_api_collection
from .media import movie_api, movies_api_collection, series_api, series_api_collection
from .routine import habit_api, habit_completion_api, habit_completions_api_collection, habits_api_collection
from .tmdb import tmdb_media_details, tmdb_media_search, tmdb_series_details

__all__ = [
    'tmdb_media_search',
    'tmdb_series_details',
    'tmdb_media_details',
    'books_api_collection',
    'book_api',
    'movies_api_collection',
    'movie_api',
    'series_api_collection',
    'series_api',
    'meals_api_collection',
    'meal_api',
    'meal_notes_api_collection',
    'courses_api_collection',
    'course_api',
    'habits_api_collection',
    'habit_api',
    'habit_completions_api_collection',
    'habit_completion_api',
]

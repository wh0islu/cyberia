from django.urls import path

from . import api, views

app_name = 'base'
urlpatterns = [
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('spotify/now-playing/', views.now_playing, name='now-playing'),
    path('spotify/recently-played/', views.recently_played, name='recently-played'),
    path('books/', views.books, name='books'),
    path('books/<int:book_id>/progress/', views.update_book_page, name='update_book_page'),
    path('meals/new/', views.create_meal, name='meal_create'),
    path('login/', views.loginUser, name='loginUser'),
    path('register/', views.registerUser, name='registerUser'),
    path('logout/', views.logoutUser, name='logoutUser'),
    path('show-seed/', views.showSeed, name='show-seed'),
    path('recovery/', views.recover_account, name='recovery'),
    path('download-seed/', views.download_seed, name='download-seed'),
    # Books
    path('api/v1/books/', api.books_api_collection, name='books_api'),
    path('api/v1/books/<int:pk>/', api.book_api, name='book_api'),
    # Movies
    path('api/v1/movies/', api.movies_api_collection, name='movies_api'),
    path('api/v1/movies/<int:pk>/', api.movie_api, name='movie_api'),
    # Series
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

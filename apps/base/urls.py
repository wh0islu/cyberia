from django.urls import path
from . import views, api


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
    path('books/api/v1', api.books_api_list, name='books_api'),
    path('book/api/v1/<int:pk>', api.book_api, name='book_api')
]

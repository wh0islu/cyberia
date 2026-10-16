from django.urls import path
from . import views, api


urlpatterns = [
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('books/', views.books, name='books'),
    path('login/', views.loginUser, name='loginUser'),
    path('register/', views.registerUser, name='registerUser'),
    path('logout/', views.logoutUser, name='logoutUser'),
    path('show-seed/', views.showSeed, name='show-seed'),
    path('recovery/', views.recover_account, name='recovery'),
    path('download-seed/', views.download_seed, name='download-seed'),
    path('books/api/v1', api.books_api_list, name='books_api'),
    path('book/api/v1/<int:pk>', api.book_api, name='book_api')
]

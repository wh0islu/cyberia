from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.loginUser, name="loginUser"),
    path('register/', views.registerUser, name='registerUser'),
    path('logout/', views.logoutUser, name="logoutUser"),
    path('show-seed/', views.showSeed, name='show-seed'),
    path('recovery/', views.recoverAccount, name='recovery'),  # type: ignore
    path("download-seed/", views.download_seed, name="download-seed"),
]

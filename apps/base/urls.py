from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.loginUser, name="loginUser"),
    path('registerUser/', views.registerUser, name='registerUser'),
    path('logoutUser/', views.logoutUser, name="logoutUser"),
    path('show-seed/', views.showSeed, name='show-seed'),
    path('recovery/', views.recoverAccount, name='recovery'),  # type: ignore
]

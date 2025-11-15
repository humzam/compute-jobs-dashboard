from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, 
    RefreshTokenView, UserProfileView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
]
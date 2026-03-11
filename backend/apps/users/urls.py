from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, ProfileView, me_view,
    instructor_profile, admin_users_list, admin_update_user,
    admin_platform_analytics, admin_pending_instructors,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('me/', me_view, name='me'),
    path('instructors/<str:username>/', instructor_profile, name='instructor-profile'),
    # Admin endpoints
    path('admin/users/', admin_users_list, name='admin-users'),
    path('admin/users/<int:user_id>/', admin_update_user, name='admin-update-user'),
    path('admin/analytics/', admin_platform_analytics, name='admin-analytics'),
    path('admin/pending-instructors/', admin_pending_instructors, name='admin-pending-instructors'),
]

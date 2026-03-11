from django.urls import path
from . import views

urlpatterns = [
    path('lessons/<int:lesson_id>/complete/', views.mark_lesson_complete),
    path('lessons/<int:lesson_id>/incomplete/', views.mark_lesson_incomplete),
    path('lessons/<int:lesson_id>/position/', views.save_video_position),
    path('courses/<slug:course_slug>/', views.course_progress),
    path('dashboard/', views.dashboard_stats),
    path('certificates/<slug:course_slug>/', views.get_certificate),
]

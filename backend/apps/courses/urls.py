from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view()),
    path('', views.CourseListView.as_view()),
    path('create/', views.CourseCreateView.as_view()),
    path('my/enrollments/', views.MyEnrollmentsView.as_view()),
    path('my/bookmarks/', views.my_bookmarks),
    path('my/wishlist/', views.my_wishlist),
    path('notifications/', views.my_notifications),
    path('notifications/read/', views.mark_notifications_read),
    # Instructor endpoints
    path('instructor/dashboard/', views.instructor_dashboard),
    path('instructor/<slug:course_slug>/students/', views.instructor_course_students),
    path('instructor/<slug:course_slug>/submit/', views.submit_course_for_approval),
    # Module endpoints
    path('modules/create/', views.ModuleCreateView.as_view()),
    path('modules/<int:pk>/', views.ModuleDetailView.as_view()),
    # Lesson endpoints
    path('lessons/create/', views.LessonCreateView.as_view()),
    path('lessons/<int:pk>/', views.LessonDetailView.as_view()),
    path('lessons/<int:lesson_id>/bookmark/', views.toggle_bookmark),
    # Review endpoints
    path('reviews/<int:pk>/', views.ReviewDetailView.as_view()),
    # Admin endpoints
    path('admin/courses/', views.admin_courses_list),
    path('admin/courses/<int:course_id>/approve/', views.admin_approve_course),
    path('admin/courses/<int:course_id>/edit/', views.admin_edit_course),
    path('admin/reviews/', views.admin_reviews_list),
    path('admin/reviews/<int:review_id>/', views.admin_delete_review),
    path('admin/reviews/<int:review_id>/flag/', views.admin_flag_review),
    path('admin/categories/', views.admin_categories),
    path('admin/categories/<int:cat_id>/', views.admin_category_detail),
    # Course detail (must be last)
    path('<slug:slug>/', views.CourseDetailView.as_view()),
    path('<slug:course_slug>/lessons/', views.LessonListView.as_view()),
    path('<slug:course_slug>/modules/', views.ModuleListView.as_view()),
    path('<slug:course_slug>/enroll/', views.enroll_course),
    path('<slug:course_slug>/unenroll/', views.unenroll_course),
    path('<slug:course_slug>/reviews/', views.ReviewListCreateView.as_view()),
    path('<slug:course_slug>/wishlist/', views.toggle_wishlist),
]


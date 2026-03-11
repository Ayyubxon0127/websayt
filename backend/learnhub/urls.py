from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from learnhub.custom_admin import admin_site

urlpatterns = [
    path('admin/', admin_site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/progress/', include('apps.progress.urls')),
    path('api/quiz/', include('apps.quiz.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

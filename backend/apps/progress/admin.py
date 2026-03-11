from django.contrib import admin
from .models import LessonProgress, LearningStreak, Certificate
admin.site.register([LessonProgress, LearningStreak, Certificate])

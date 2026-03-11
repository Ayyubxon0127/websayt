import uuid
from django.db import models
from apps.users.models import User
from apps.courses.models import Lesson


class LessonProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_watched_at = models.DateTimeField(auto_now=True)
    last_position_seconds = models.PositiveIntegerField(default=0)
    watch_time_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ('user', 'lesson')

    def __str__(self):
        return f"{'✓' if self.completed else '○'} {self.user.email} - {self.lesson.title}"


class LearningStreak(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    total_days_learned = models.PositiveIntegerField(default=0)
    total_lessons_completed = models.PositiveIntegerField(default=0)
    total_watch_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'learning_streaks'


class Certificate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    enrollment = models.OneToOneField('courses.Enrollment', on_delete=models.CASCADE, related_name='certificate')
    issued_at = models.DateTimeField(auto_now_add=True)
    certificate_id = models.CharField(max_length=32, unique=True)

    class Meta:
        db_table = 'certificates'

    def __str__(self):
        return f"Cert: {self.user.email} — {self.enrollment.course.title}"

from django.db import models
from apps.courses.models import Lesson, Course
from apps.users.models import User


class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)
    pass_score = models.PositiveSmallIntegerField(default=70, help_text='Minimum % to pass')
    time_limit_minutes = models.PositiveSmallIntegerField(default=0, help_text='0 = no limit')
    max_attempts = models.PositiveSmallIntegerField(default=0, help_text='0 = unlimited')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quizzes'
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return f"Quiz: {self.lesson.title}"


class Question(models.Model):
    TYPE_MULTIPLE = 'multiple'
    TYPE_TRUEFALSE = 'truefalse'
    TYPE_CHOICES = [
        (TYPE_MULTIPLE, 'Multiple Choice'),
        (TYPE_TRUEFALSE, 'True / False'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_MULTIPLE)
    options = models.JSONField(help_text='List of option strings')
    correct_index = models.PositiveSmallIntegerField(help_text='0-based index of correct option')
    explanation = models.TextField(blank=True, help_text='Explanation shown after answering')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'quiz_questions'
        ordering = ['order']

    def __str__(self):
        return self.text[:60]


class UserQuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    answers = models.JSONField(help_text='List of chosen option indices')
    score = models.PositiveSmallIntegerField()
    passed = models.BooleanField(default=False)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-attempted_at']

    def __str__(self):
        return f"{self.user.email} — {self.quiz} ({self.score}%)"


from django.contrib import admin
from learnhub.custom_admin import admin_site
from .models import Quiz, Question, UserQuizAttempt


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('order', 'text', 'options', 'correct_index')


@admin.register(Quiz, site=admin_site)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'pass_score', 'question_count_display', 'created_at')
    inlines = [QuestionInline]

    def question_count_display(self, obj):
        return obj.questions.count()
    question_count_display.short_description = 'Questions'


@admin.register(UserQuizAttempt, site=admin_site)
class UserQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'passed', 'attempted_at')
    list_filter = ('passed',)
    readonly_fields = ('attempted_at',)

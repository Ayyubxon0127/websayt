from django.urls import path
from .views import get_quiz, submit_quiz, create_quiz, add_question, delete_question, my_quiz_history

urlpatterns = [
    path('lessons/<int:lesson_id>/', get_quiz, name='quiz-get'),
    path('lessons/<int:lesson_id>/submit/', submit_quiz, name='quiz-submit'),
    path('create/', create_quiz, name='quiz-create'),
    path('<int:quiz_id>/questions/', add_question, name='quiz-add-question'),
    path('questions/<int:question_id>/', delete_question, name='quiz-delete-question'),
    path('my/history/', my_quiz_history, name='quiz-history'),
]

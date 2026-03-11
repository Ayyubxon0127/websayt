from rest_framework import serializers as drf_serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Quiz, Question, UserQuizAttempt


class QuestionSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'options', 'explanation', 'order')


class QuestionCreateSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'quiz', 'text', 'question_type', 'options', 'correct_index', 'explanation', 'order')


class QuizSerializer(drf_serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = drf_serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'pass_score', 'time_limit_minutes', 'max_attempts',
                  'questions', 'question_count')

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizCreateSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ('id', 'lesson', 'title', 'pass_score', 'time_limit_minutes', 'max_attempts')


class AttemptSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = UserQuizAttempt
        fields = ('id', 'score', 'passed', 'answers', 'time_taken_seconds', 'attempted_at')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz(request, lesson_id):
    try:
        quiz = Quiz.objects.prefetch_related('questions').get(lesson_id=lesson_id)
    except Quiz.DoesNotExist:
        return Response({'detail': 'No quiz for this lesson.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizSerializer(quiz)
    data = serializer.data

    attempts = UserQuizAttempt.objects.filter(user=request.user, quiz=quiz).order_by('-attempted_at')
    data['last_attempt'] = AttemptSerializer(attempts.first()).data if attempts.exists() else None
    data['attempt_count'] = attempts.count()
    data['all_attempts'] = AttemptSerializer(attempts[:5], many=True).data

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, lesson_id):
    try:
        quiz = Quiz.objects.prefetch_related('questions').get(lesson_id=lesson_id)
    except Quiz.DoesNotExist:
        return Response({'detail': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check max attempts
    if quiz.max_attempts > 0:
        attempt_count = UserQuizAttempt.objects.filter(user=request.user, quiz=quiz).count()
        if attempt_count >= quiz.max_attempts:
            return Response({'detail': f'Maximum {quiz.max_attempts} attempts reached.'}, status=400)

    answers = request.data.get('answers', [])
    time_taken = request.data.get('time_taken_seconds', 0)
    questions = list(quiz.questions.all())

    if len(answers) != len(questions):
        return Response({'detail': 'Answer count mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

    correct = sum(
        1 for i, q in enumerate(questions)
        if answers[i] == q.correct_index
    )
    score = round((correct / len(questions)) * 100) if questions else 0
    passed = score >= quiz.pass_score

    attempt = UserQuizAttempt.objects.create(
        user=request.user,
        quiz=quiz,
        answers=answers,
        score=score,
        passed=passed,
        time_taken_seconds=time_taken,
    )

    # Build detailed results with correct answers and explanations
    results = []
    for i, q in enumerate(questions):
        results.append({
            'question_id': q.id,
            'question_text': q.text,
            'your_answer': answers[i],
            'correct_answer': q.correct_index,
            'is_correct': answers[i] == q.correct_index,
            'explanation': q.explanation,
            'options': q.options,
        })

    # Notify if passed
    if passed:
        from apps.courses.models import Notification
        Notification.objects.create(
            user=request.user,
            type='quiz_passed',
            title=f'Quiz Passed! 🎉',
            message=f'You scored {score}% on "{quiz.title}". Well done!',
        )

    return Response({
        'score': score,
        'passed': passed,
        'correct': correct,
        'total': len(questions),
        'pass_score': quiz.pass_score,
        'attempt_id': attempt.id,
        'results': results,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    """Instructor creates a quiz for a lesson"""
    from apps.courses.models import Lesson
    lesson_id = request.data.get('lesson')
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found'}, status=404)

    if not (request.user.is_staff or lesson.course.instructor == request.user):
        return Response({'error': 'Not authorized'}, status=403)

    serializer = QuizCreateSerializer(data=request.data)
    if serializer.is_valid():
        quiz = serializer.save()
        return Response(QuizSerializer(quiz).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_question(request, quiz_id):
    """Instructor adds a question to a quiz"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=404)

    if not (request.user.is_staff or quiz.lesson.course.instructor == request.user):
        return Response({'error': 'Not authorized'}, status=403)

    data = request.data.copy()
    data['quiz'] = quiz_id
    serializer = QuestionCreateSerializer(data=data)
    if serializer.is_valid():
        q = serializer.save()
        return Response(QuestionCreateSerializer(q).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    try:
        q = Question.objects.get(pk=question_id)
    except Question.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if not (request.user.is_staff or q.quiz.lesson.course.instructor == request.user):
        return Response({'error': 'Not authorized'}, status=403)

    q.delete()
    return Response({'deleted': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_quiz_history(request):
    """Student's quiz attempt history"""
    attempts = UserQuizAttempt.objects.filter(user=request.user).select_related(
        'quiz__lesson__course'
    ).order_by('-attempted_at')[:20]

    return Response([
        {
            'id': a.id,
            'quiz_title': a.quiz.title,
            'lesson_title': a.quiz.lesson.title,
            'course_title': a.quiz.lesson.course.title,
            'course_slug': a.quiz.lesson.course.slug,
            'score': a.score,
            'passed': a.passed,
            'time_taken_seconds': a.time_taken_seconds,
            'attempted_at': a.attempted_at,
        }
        for a in attempts
    ])

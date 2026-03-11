import uuid
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.utils.timezone import localdate
from apps.courses.models import Lesson, Enrollment, Course, Notification
from .models import LessonProgress, LearningStreak, Certificate


def _update_streak(user):
    today = localdate()
    streak, _ = LearningStreak.objects.get_or_create(user=user)
    if streak.last_activity_date == today:
        return streak
    yesterday = today - timedelta(days=1)
    if streak.last_activity_date == yesterday:
        streak.current_streak += 1
    elif streak.last_activity_date and streak.last_activity_date < yesterday:
        streak.current_streak = 1
    else:
        streak.current_streak = 1
    streak.last_activity_date = today
    streak.total_days_learned += 1
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak
    # Milestone notifications
    if streak.current_streak in [3, 7, 14, 30, 60, 100]:
        Notification.objects.create(
            user=user,
            type='streak',
            title=f'🔥 {streak.current_streak}-Day Streak!',
            message=f'You\'ve learned for {streak.current_streak} days in a row! Keep it up!',
        )
    streak.save()
    return streak


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_complete(request, lesson_id):
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not Enrollment.objects.filter(user=request.user, course=lesson.course).exists():
        return Response({'error': 'Not enrolled.'}, status=status.HTTP_403_FORBIDDEN)

    progress, _ = LessonProgress.objects.get_or_create(user=request.user, lesson=lesson)
    progress.completed = True
    progress.completed_at = timezone.now()
    progress.save()

    streak = _update_streak(request.user)

    # Update enrollment last_accessed
    Enrollment.objects.filter(user=request.user, course=lesson.course).update(last_accessed=timezone.now())

    total = lesson.course.lessons.count()
    completed_count = request.user.lesson_progress.filter(lesson__course=lesson.course, completed=True).count()
    course_completed = False

    if completed_count >= total:
        enrollment = Enrollment.objects.get(user=request.user, course=lesson.course)
        if not enrollment.completed:
            enrollment.completed = True
            enrollment.completed_at = timezone.now()
            enrollment.save()
            course_completed = True
            cert, _ = Certificate.objects.get_or_create(
                user=request.user,
                enrollment=enrollment,
                defaults={'certificate_id': uuid.uuid4().hex[:16].upper()},
            )
            Notification.objects.create(
                user=request.user,
                type='completion',
                title='🎉 Course Complete!',
                message=f'You completed "{lesson.course.title}". Your certificate is ready!',
                link=f'/certificate/{lesson.course.slug}',
            )

    return Response({
        'completed': True,
        'course_progress': round((completed_count / total) * 100) if total else 0,
        'lessons_completed': completed_count,
        'total_lessons': total,
        'course_completed': course_completed,
        'streak': {'current': streak.current_streak, 'longest': streak.longest_streak},
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_incomplete(request, lesson_id):
    try:
        p = LessonProgress.objects.get(user=request.user, lesson_id=lesson_id)
        p.completed = False
        p.completed_at = None
        p.save()
    except LessonProgress.DoesNotExist:
        pass
    return Response({'completed': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_video_position(request, lesson_id):
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    position = request.data.get('position_seconds', 0)
    watch_time = request.data.get('watch_time_seconds', 0)

    progress, _ = LessonProgress.objects.get_or_create(user=request.user, lesson=lesson)
    if position > progress.last_position_seconds:
        progress.last_position_seconds = position
    progress.watch_time_seconds = max(progress.watch_time_seconds, watch_time)
    progress.save(update_fields=['last_position_seconds', 'watch_time_seconds', 'last_watched_at'])

    Enrollment.objects.filter(user=request.user, course=lesson.course).update(last_accessed=timezone.now())
    return Response({'saved': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_progress(request, course_slug):
    try:
        course = Course.objects.get(slug=course_slug)
    except Course.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    lessons = course.lessons.all()
    records = {
        p['lesson_id']: p
        for p in LessonProgress.objects.filter(
            user=request.user, lesson__course=course
        ).values('lesson_id', 'completed', 'last_position_seconds')
    }
    total = lessons.count()
    completed = sum(1 for p in records.values() if p['completed'])

    return Response({
        'course_slug': course_slug,
        'total_lessons': total,
        'completed_lessons': completed,
        'percentage': round((completed / total) * 100) if total else 0,
        'lesson_progress': [
            {
                'lesson_id': l.id,
                'completed': records.get(l.id, {}).get('completed', False),
                'last_position_seconds': records.get(l.id, {}).get('last_position_seconds', 0),
            }
            for l in lessons
        ],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
    last_p = LessonProgress.objects.filter(
        user=request.user
    ).select_related('lesson', 'lesson__course').order_by('-last_watched_at').first()

    last_watched = None
    if last_p:
        lesson = last_p.lesson
        course = lesson.course
        lesson_ids = list(course.lessons.values_list('id', flat=True))
        idx = lesson_ids.index(lesson.id) if lesson.id in lesson_ids else 0
        last_watched = {
            'lesson_id': lesson.id,
            'lesson_title': lesson.title,
            'course_slug': course.slug,
            'course_title': course.title,
            'course_image': course.cover_image,
            'lesson_index': idx,
            'last_watched_at': last_p.last_watched_at,
            'last_position_seconds': last_p.last_position_seconds,
        }

    recent = LessonProgress.objects.filter(
        user=request.user
    ).select_related('lesson', 'lesson__course').order_by('-last_watched_at')[:6]
    recently_watched = [
        {
            'lesson_id': lp.lesson.id,
            'lesson_title': lp.lesson.title,
            'course_slug': lp.lesson.course.slug,
            'course_title': lp.lesson.course.title,
            'completed': lp.completed,
            'last_watched_at': lp.last_watched_at,
        }
        for lp in recent
    ]

    streak_obj = LearningStreak.objects.filter(user=request.user).first()
    total_minutes = (streak_obj.total_watch_minutes if streak_obj else 0)

    return Response({
        'total_enrolled': enrollments.count(),
        'in_progress': enrollments.filter(completed=False).count(),
        'completed': enrollments.filter(completed=True).count(),
        'last_watched': last_watched,
        'recently_watched': recently_watched,
        'streak': {
            'current': streak_obj.current_streak if streak_obj else 0,
            'longest': streak_obj.longest_streak if streak_obj else 0,
            'total_days': streak_obj.total_days_learned if streak_obj else 0,
            'total_lessons': streak_obj.total_lessons_completed if streak_obj else 0,
            'total_watch_minutes': total_minutes,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_certificate(request, course_slug):
    try:
        enrollment = Enrollment.objects.get(user=request.user, course__slug=course_slug)
    except Enrollment.DoesNotExist:
        return Response({'error': 'Not enrolled.'}, status=status.HTTP_404_NOT_FOUND)

    if not enrollment.completed:
        return Response({'error': 'Course not completed yet.'}, status=status.HTTP_400_BAD_REQUEST)

    cert, _ = Certificate.objects.get_or_create(
        user=request.user,
        enrollment=enrollment,
        defaults={'certificate_id': uuid.uuid4().hex[:16].upper()},
    )
    return Response({
        'certificate_id': cert.certificate_id,
        'student_name': request.user.full_name or request.user.username,
        'course_title': enrollment.course.title,
        'instructor_name': enrollment.course.instructor.full_name,
        'issued_at': cert.issued_at,
        'completed_at': enrollment.completed_at,
    })

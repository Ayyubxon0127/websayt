from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Avg, Count
from django.utils import timezone
from .models import User
from .serializers import RegisterSerializer, UserProfileSerializer, UserAdminSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_banned:
            from rest_framework import serializers as drf_s
            raise drf_s.ValidationError('Your account has been suspended.')
        data['user'] = UserProfileSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Registration successful.',
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserProfileSerializer(request.user).data)


@api_view(['GET'])
def instructor_profile(request, username):
    try:
        instructor = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Instructor not found.'}, status=status.HTTP_404_NOT_FOUND)

    courses = instructor.courses_taught.filter(is_published=True)
    total_students = sum(c.enrollment_count for c in courses)
    avg_data = courses.aggregate(avg=Avg('reviews__rating'))

    return Response({
        'id': instructor.id,
        'username': instructor.username,
        'full_name': instructor.full_name,
        'bio': instructor.bio,
        'profile_avatar': instructor.profile_avatar,
        'website': instructor.website,
        'twitter': instructor.twitter,
        'linkedin': instructor.linkedin,
        'location': instructor.location,
        'courses': [
            {
                'id': c.id,
                'title': c.title,
                'slug': c.slug,
                'cover_image': c.cover_image,
                'level': c.level,
                'enrollment_count': c.enrollment_count,
                'lesson_count': c.lesson_count,
            }
            for c in courses
        ],
        'total_courses': courses.count(),
        'total_students': total_students,
        'avg_rating': round(avg_data['avg'], 1) if avg_data['avg'] else None,
    })


# ─── Admin User Management ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    if not (request.user.is_staff or request.user.role == 'admin'):
        return Response({'error': 'Forbidden'}, status=403)

    users = User.objects.all().order_by('-date_joined')
    search = request.query_params.get('search', '')
    role_filter = request.query_params.get('role', '')
    if search:
        from django.db.models import Q
        users = users.filter(
            Q(email__icontains=search) | Q(username__icontains=search) |
            Q(first_name__icontains=search) | Q(last_name__icontains=search)
        )
    if role_filter:
        users = users.filter(role=role_filter)

    return Response({
        'count': users.count(),
        'users': UserAdminSerializer(users[:100], many=True).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, user_id):
    if not (request.user.is_staff or request.user.role == 'admin'):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    allowed = ['role', 'is_banned', 'is_active', 'instructor_approved']
    for field in allowed:
        if field in request.data:
            setattr(user, field, request.data[field])

    # Sync role flags
    if request.data.get('role') == 'instructor':
        user.is_instructor = True
    elif request.data.get('role') == 'admin':
        user.is_staff = True
        user.is_instructor = False

    user.save()
    return Response(UserAdminSerializer(user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_platform_analytics(request):
    if not (request.user.is_staff or request.user.role == 'admin'):
        return Response({'error': 'Forbidden'}, status=403)

    from apps.courses.models import Course, Enrollment
    from apps.progress.models import LessonProgress, Certificate

    total_users = User.objects.count()
    total_students = User.objects.filter(role='student').count()
    total_instructors = User.objects.filter(role='instructor').count()
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(is_published=True).count()
    total_enrollments = Enrollment.objects.count()
    completed_enrollments = Enrollment.objects.filter(completed=True).count()
    total_lessons_completed = LessonProgress.objects.filter(completed=True).count()
    total_certificates = Certificate.objects.count()

    # Monthly signups (last 6 months)
    from datetime import date
    from django.db.models.functions import TruncMonth
    monthly_signups = (
        User.objects
        .filter(date_joined__gte=timezone.now() - timezone.timedelta(days=180))
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    # Recent activity
    recent_enrollments = Enrollment.objects.select_related('user', 'course').order_by('-enrolled_at')[:10]

    return Response({
        'total_users': total_users,
        'total_students': total_students,
        'total_instructors': total_instructors,
        'total_courses': total_courses,
        'published_courses': published_courses,
        'total_enrollments': total_enrollments,
        'completed_enrollments': completed_enrollments,
        'completion_rate': round((completed_enrollments / total_enrollments * 100) if total_enrollments else 0, 1),
        'total_lessons_completed': total_lessons_completed,
        'total_certificates': total_certificates,
        'monthly_signups': [
            {'month': m['month'].strftime('%b %Y'), 'count': m['count']}
            for m in monthly_signups
        ],
        'recent_activity': [
            {
                'user': e.user.full_name,
                'action': f'Enrolled in {e.course.title}',
                'time': e.enrolled_at,
            }
            for e in recent_enrollments
        ],
    })



# ── Admin: Pending Instructors ─────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pending_instructors(request):
    if not (request.user.is_staff or request.user.role == 'admin'):
        return Response({'error': 'Forbidden'}, status=403)
    from django.db.models import Count
    pending = User.objects.filter(
        role='instructor', instructor_approved=False
    ).annotate(course_count=Count('courses_taught')).order_by('-date_joined')
    return Response([{
        'id': u.id,
        'full_name': u.full_name,
        'email': u.email,
        'username': u.username,
        'date_joined': u.date_joined,
        'course_count': u.course_count,
        'instructor_approved': u.instructor_approved,
    } for u in pending])

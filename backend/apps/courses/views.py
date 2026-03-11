from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Category, Course, Module, Lesson, Enrollment, Review, Bookmark, Wishlist, Notification
from .serializers import (
    CategorySerializer, CourseListSerializer, CourseDetailSerializer,
    CourseCreateSerializer, CourseAdminSerializer,
    ModuleSerializer, ModuleCreateSerializer,
    LessonSerializer, LessonCreateSerializer,
    EnrollmentSerializer, ReviewSerializer, WishlistSerializer, NotificationSerializer,
)


def is_admin(user):
    return user.is_authenticated and (user.is_staff or getattr(user, 'role', '') == 'admin')

def is_instructor(user):
    return user.is_authenticated and (user.is_staff or getattr(user, 'is_instructor', False) or getattr(user, 'role', '') in ('instructor', 'admin'))


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []


class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'level', 'is_featured']
    search_fields = ['title', 'description', 'instructor__first_name', 'instructor__last_name']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).select_related('instructor', 'category')

        if self.request.query_params.get('trending'):
            from datetime import timedelta
            since = timezone.now() - timedelta(days=30)
            return qs.annotate(
                recent=Count('enrollments', filter=Q(enrollments__enrolled_at__gte=since))
            ).order_by('-recent')

        if self.request.query_params.get('popular'):
            return qs.annotate(total=Count('enrollments')).order_by('-total')

        if self.request.query_params.get('top_rated'):
            return qs.annotate(avg_r=Avg('reviews__rating')).order_by('-avg_r')

        return qs


class CourseCreateView(generics.CreateAPIView):
    serializer_class = CourseCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        user = self.request.user
        if user and (user.is_staff or getattr(user, 'is_instructor', False) or getattr(user, 'role', '') in ('instructor', 'admin')):
            return [IsAuthenticated()]
        return [IsAdminUser()]


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = 'slug'
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Course.objects.select_related('instructor', 'category').prefetch_related(
            'modules__lessons', 'lessons', 'reviews__user'
        )

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CourseCreateSerializer
        return CourseDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def update(self, request, *args, **kwargs):
        course = self.get_object()
        # Allow instructor to edit their own course, or admin to edit any
        if not (is_admin(request.user) or course.instructor == request.user):
            return Response({'error': 'Forbidden'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if not (is_admin(request.user) or course.instructor == request.user):
            return Response({'error': 'Forbidden'}, status=403)
        return super().destroy(request, *args, **kwargs)


# ─── Module Views ─────────────────────────────────────────────────────────────

class ModuleListView(generics.ListAPIView):
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Module.objects.filter(course__slug=self.kwargs['course_slug']).prefetch_related('lessons')


class ModuleCreateView(generics.CreateAPIView):
    serializer_class = ModuleCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not (is_admin(self.request.user) or course.instructor == self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Not your course.')
        serializer.save()


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Module.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ModuleSerializer if self.request.method == 'GET' else ModuleCreateSerializer


# ─── Lesson Views ─────────────────────────────────────────────────────────────

class LessonListView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Lesson.objects.filter(course__slug=self.kwargs['course_slug'])


class LessonCreateView(generics.CreateAPIView):
    serializer_class = LessonCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not (is_admin(self.request.user) or course.instructor == self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Not your course.')
        serializer.save()


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LessonSerializer if self.request.method == 'GET' else LessonCreateSerializer


# ─── Enrollment ───────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_course(request, course_slug):
    try:
        course = Course.objects.get(slug=course_slug, is_published=True)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    enrollment, created = Enrollment.objects.get_or_create(user=request.user, course=course)
    if created:
        Notification.objects.create(
            user=request.user,
            type='enrollment',
            title='Enrolled successfully!',
            message=f'You\'ve enrolled in "{course.title}". Start learning now!',
            link=f'/courses/{course.slug}',
        )
        return Response({'message': 'Enrolled!', 'enrolled': True}, status=status.HTTP_201_CREATED)
    return Response({'message': 'Already enrolled.', 'enrolled': True})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unenroll_course(request, course_slug):
    try:
        Enrollment.objects.get(user=request.user, course__slug=course_slug).delete()
        return Response({'enrolled': False})
    except Enrollment.DoesNotExist:
        return Response({'error': 'Not enrolled.'}, status=status.HTTP_404_NOT_FOUND)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related('course').order_by(
            '-last_accessed', '-enrolled_at'
        )


# ─── Reviews ──────────────────────────────────────────────────────────────────

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'POST' else []

    def get_queryset(self):
        return Review.objects.filter(course__slug=self.kwargs['course_slug']).select_related('user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = Course.objects.get(slug=self.kwargs['course_slug'])
        return ctx

    def create(self, request, *args, **kwargs):
        course = Course.objects.get(slug=self.kwargs['course_slug'])
        if not Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response({'error': 'Enroll first to review.'}, status=status.HTTP_403_FORBIDDEN)
        if Review.objects.filter(user=request.user, course=course).exists():
            return Response({'error': 'Already reviewed.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['course'] = self.get_object().course
        return ctx


# ─── Bookmarks / Wishlist / Notifications ────────────────────────────────────

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, lesson_id):
    try:
        lesson = Lesson.objects.get(pk=lesson_id)
    except Lesson.DoesNotExist:
        return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        note = request.data.get('note', '')
        Bookmark.objects.get_or_create(user=request.user, lesson=lesson, defaults={'note': note})
        return Response({'bookmarked': True})
    Bookmark.objects.filter(user=request.user, lesson=lesson).delete()
    return Response({'bookmarked': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookmarks(request):
    bmarks = Bookmark.objects.filter(user=request.user).select_related('lesson', 'lesson__course')
    return Response([
        {
            'id': b.id,
            'lesson_id': b.lesson.id,
            'lesson_title': b.lesson.title,
            'course_slug': b.lesson.course.slug,
            'course_title': b.lesson.course.title,
            'note': b.note,
            'created_at': b.created_at,
        }
        for b in bmarks
    ])


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request, course_slug):
    try:
        course = Course.objects.get(slug=course_slug, is_published=True)
    except Course.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        Wishlist.objects.get_or_create(user=request.user, course=course)
        return Response({'wishlisted': True})
    Wishlist.objects.filter(user=request.user, course=course).delete()
    return Response({'wishlisted': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_wishlist(request):
    items = Wishlist.objects.filter(user=request.user).select_related('course')
    return Response(WishlistSerializer(items, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    notifs = Notification.objects.filter(user=request.user)[:20]
    unread = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({
        'notifications': NotificationSerializer(notifs, many=True).data,
        'unread_count': unread,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})


# ─── Instructor Dashboard ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_dashboard(request):
    if not is_instructor(request.user):
        return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    courses = Course.objects.filter(instructor=request.user).prefetch_related('enrollments', 'reviews')
    total_students = sum(c.enrollments.count() for c in courses)
    all_reviews = Review.objects.filter(course__instructor=request.user)
    avg_r = round(all_reviews.aggregate(avg=Avg('rating'))['avg'], 1) if all_reviews.exists() else None

    return Response({
        'total_courses': courses.count(),
        'published_courses': courses.filter(is_published=True).count(),
        'pending_courses': courses.filter(approval_status='pending').count(),
        'total_students': total_students,
        'avg_rating': avg_r,
        'courses': [
            {
                'id': c.id,
                'title': c.title,
                'slug': c.slug,
                'level': c.level,
                'is_published': c.is_published,
                'approval_status': c.approval_status,
                'lesson_count': c.lesson_count,
                'enrollment_count': c.enrollments.count(),
                'review_count': c.reviews.count(),
                'avg_rating': round(c.reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 1),
                'cover_image': c.cover_image,
                'created_at': c.created_at,
            }
            for c in courses
        ],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_course_students(request, course_slug):
    try:
        course = Course.objects.get(slug=course_slug, instructor=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Not found or not yours.'}, status=status.HTTP_404_NOT_FOUND)

    enrollments = Enrollment.objects.filter(course=course).select_related('user')
    return Response({
        'course_title': course.title,
        'students': [
            {
                'user_id': e.user.id,
                'full_name': e.user.full_name,
                'email': e.user.email,
                'enrolled_at': e.enrolled_at,
                'progress': e.progress_percentage,
                'completed': e.completed,
            }
            for e in enrollments
        ],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_course_for_approval(request, course_slug):
    """Instructor submits course for admin review"""
    try:
        course = Course.objects.get(slug=course_slug, instructor=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    course.approval_status = 'pending'
    course.save()
    return Response({'status': 'pending', 'message': 'Course submitted for approval.'})


# ─── Admin Course Management ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_courses_list(request):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)

    courses = Course.objects.all().select_related('instructor', 'category').order_by('-created_at')
    status_filter = request.query_params.get('status', '')
    if status_filter:
        courses = courses.filter(approval_status=status_filter)

    return Response({
        'count': courses.count(),
        'courses': CourseAdminSerializer(courses[:100], many=True).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_approve_course(request, course_id):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    action = request.data.get('action')  # 'approve' or 'reject'
    notes = request.data.get('admin_notes', '')

    if action == 'approve':
        course.approval_status = 'approved'
        course.is_published = True
        course.admin_notes = notes
        course.save()
        Notification.objects.create(
            user=course.instructor,
            type='course_approved',
            title='Course Approved! 🎉',
            message=f'Your course "{course.title}" has been approved and is now live.',
            link=f'/courses/{course.slug}',
        )
    elif action == 'reject':
        course.approval_status = 'rejected'
        course.is_published = False
        course.admin_notes = notes
        course.save()
        Notification.objects.create(
            user=course.instructor,
            type='course_rejected',
            title='Course Needs Revision',
            message=f'Your course "{course.title}" was not approved. Notes: {notes}',
            link=f'/instructor',
        )
    else:
        return Response({'error': 'Invalid action'}, status=400)

    return Response(CourseAdminSerializer(course).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_review(request, review_id):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        review = Review.objects.get(pk=review_id)
        review.delete()
        return Response({'deleted': True})
    except Review.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


# ─── Admin Category Management ────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_categories(request):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    if request.method == 'GET':
        cats = Category.objects.annotate(total=Count('courses')).order_by('name')
        return Response([{
            'id': c.id, 'name': c.name, 'slug': c.slug,
            'icon': c.icon, 'color': c.color, 'description': c.description,
            'course_count': c.total,
        } for c in cats])
    # POST — create
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_category_detail(request, cat_id):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        cat = Category.objects.get(pk=cat_id)
    except Category.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if request.method == 'DELETE':
        cat.delete()
        return Response({'deleted': True})
    serializer = CategorySerializer(cat, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ─── Admin Review Moderation ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reviews_list(request):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    reviews = Review.objects.select_related('user', 'course').order_by('-created_at')[:100]
    flagged_only = request.query_params.get('flagged') == 'true'
    if flagged_only:
        reviews = Review.objects.filter(is_flagged=True).select_related('user', 'course').order_by('-created_at')
    return Response([{
        'id': r.id,
        'user': r.user.full_name,
        'user_email': r.user.email,
        'course_title': r.course.title,
        'course_slug': r.course.slug,
        'rating': r.rating,
        'comment': r.comment,
        'is_flagged': r.is_flagged,
        'created_at': r.created_at,
    } for r in reviews])


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_flag_review(request, review_id):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        review = Review.objects.get(pk=review_id)
        review.is_flagged = not review.is_flagged
        review.save()
        return Response({'is_flagged': review.is_flagged})
    except Review.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


# ── Admin: Edit Course ─────────────────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_edit_course(request, course_id):
    if not is_admin(request.user):
        return Response({'error': 'Forbidden'}, status=403)
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    allowed = ['title', 'short_description', 'description', 'level',
               'language', 'image_url', 'is_published', 'is_featured',
               'approval_status', 'admin_notes']
    for field in allowed:
        if field in request.data:
            setattr(course, field, request.data[field])
    course.save()
    return Response(CourseAdminSerializer(course).data)

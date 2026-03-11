from rest_framework import serializers
from django.db.models import Avg
from apps.users.serializers import UserPublicSerializer
from .models import Category, Course, Module, Lesson, Enrollment, Review, Wishlist, Notification


class CategorySerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon', 'description', 'color', 'course_count')

    def get_course_count(self, obj):
        return obj.courses.filter(is_published=True).count()


class LessonSerializer(serializers.ModelSerializer):
    youtube_embed_url = serializers.ReadOnlyField()
    is_completed = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    last_position_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            'id', 'title', 'description', 'lesson_type', 'youtube_url', 'youtube_embed_url',
            'text_content', 'module', 'order', 'duration_minutes', 'is_free_preview', 'is_locked',
            'is_completed', 'is_bookmarked', 'last_position_seconds', 'created_at',
        )

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.progress.filter(user=request.user, completed=True).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_last_position_seconds(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            p = obj.progress.filter(user=request.user).first()
            return p.last_position_seconds if p else 0
        return 0


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'course', 'module', 'title', 'description', 'lesson_type',
                  'youtube_url', 'text_content', 'order', 'duration_minutes',
                  'is_free_preview', 'is_locked')


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.ReadOnlyField()

    class Meta:
        model = Module
        fields = ('id', 'title', 'description', 'order', 'lesson_count', 'lessons')


class ModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ('id', 'course', 'title', 'description', 'order')


class ReviewSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'rating', 'comment', 'is_flagged', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'is_flagged', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['course'] = self.context['course']
        return super().create(validated_data)


class CourseListSerializer(serializers.ModelSerializer):
    instructor = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    lesson_count = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    cover_image = serializers.ReadOnlyField()
    total_duration_display = serializers.ReadOnlyField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'short_description', 'cover_image',
            'instructor', 'category', 'level', 'language',
            'lesson_count', 'enrollment_count', 'total_duration_display',
            'is_enrolled', 'is_wishlisted', 'is_featured', 'approval_status',
            'avg_rating', 'review_count', 'created_at',
        )

    def get_is_enrolled(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.enrollments.filter(user=req.user).exists()
        return False

    def get_is_wishlisted(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.wishlisted_by.filter(user=req.user).exists()
        return False

    def get_avg_rating(self, obj):
        r = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(r, 1) if r else None

    def get_review_count(self, obj):
        return obj.reviews.count()


class CourseDetailSerializer(serializers.ModelSerializer):
    instructor = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    cover_image = serializers.ReadOnlyField()
    total_duration_display = serializers.ReadOnlyField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    rating_breakdown = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'description', 'short_description',
            'what_you_learn', 'requirements',
            'cover_image', 'image_url', 'instructor', 'category',
            'level', 'language',
            'modules', 'lessons', 'lesson_count', 'enrollment_count', 'total_duration_display',
            'is_enrolled', 'is_wishlisted', 'progress_percentage',
            'is_featured', 'is_published', 'approval_status', 'admin_notes',
            'avg_rating', 'review_count', 'rating_breakdown', 'user_review',
            'created_at', 'updated_at',
        )

    def get_is_enrolled(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.enrollments.filter(user=req.user).exists()
        return False

    def get_is_wishlisted(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.wishlisted_by.filter(user=req.user).exists()
        return False

    def get_progress_percentage(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            e = obj.enrollments.filter(user=req.user).first()
            return e.progress_percentage if e else 0
        return 0

    def get_avg_rating(self, obj):
        r = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(r, 1) if r else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_rating_breakdown(self, obj):
        total = obj.reviews.count()
        if not total:
            return []
        result = []
        for star in range(5, 0, -1):
            count = obj.reviews.filter(rating=star).count()
            result.append({
                'star': star,
                'count': count,
                'percentage': round((count / total) * 100),
            })
        return result

    def get_user_review(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            review = obj.reviews.filter(user=req.user).first()
            if review:
                return ReviewSerializer(review, context=self.context).data
        return None


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'description', 'short_description',
            'what_you_learn', 'requirements',
            'image', 'image_url', 'category', 'level', 'language',
            'is_published', 'is_featured', 'approval_status',
        )

    def create(self, validated_data):
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)


class CourseAdminSerializer(serializers.ModelSerializer):
    """Full admin view of a course"""
    instructor = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    lesson_count = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    cover_image = serializers.ReadOnlyField()
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'short_description', 'cover_image',
            'instructor', 'category', 'level', 'language',
            'is_published', 'is_featured', 'approval_status', 'admin_notes',
            'lesson_count', 'enrollment_count', 'avg_rating',
            'created_at', 'updated_at',
        )

    def get_avg_rating(self, obj):
        r = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(r, 1) if r else None


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Enrollment
        fields = ('id', 'course', 'enrolled_at', 'completed', 'completed_at',
                  'progress_percentage', 'last_accessed')


class WishlistSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'course', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'link', 'is_read', 'created_at')



class CategorySerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon', 'description', 'color', 'course_count')

    def get_course_count(self, obj):
        return obj.courses.filter(is_published=True).count()


class LessonSerializer(serializers.ModelSerializer):
    youtube_embed_url = serializers.ReadOnlyField()
    is_completed = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    last_position_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            'id', 'title', 'description', 'youtube_url', 'youtube_embed_url',
            'order', 'duration_minutes', 'is_free_preview', 'is_locked',
            'is_completed', 'is_bookmarked', 'last_position_seconds', 'created_at',
        )

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.progress.filter(user=request.user, completed=True).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_last_position_seconds(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            p = obj.progress.filter(user=request.user).first()
            return p.last_position_seconds if p else 0
        return 0


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'course', 'title', 'description', 'youtube_url',
                  'order', 'duration_minutes', 'is_free_preview', 'is_locked')


class ReviewSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'rating', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['course'] = self.context['course']
        return super().create(validated_data)


class CourseListSerializer(serializers.ModelSerializer):
    instructor = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    lesson_count = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    cover_image = serializers.ReadOnlyField()
    total_duration_display = serializers.ReadOnlyField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'short_description', 'cover_image',
            'instructor', 'category', 'level', 'language',
            'lesson_count', 'enrollment_count', 'total_duration_display',
            'is_enrolled', 'is_wishlisted', 'is_featured',
            'avg_rating', 'review_count', 'created_at',
        )

    def get_is_enrolled(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.enrollments.filter(user=req.user).exists()
        return False

    def get_is_wishlisted(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.wishlisted_by.filter(user=req.user).exists()
        return False

    def get_avg_rating(self, obj):
        r = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(r, 1) if r else None

    def get_review_count(self, obj):
        return obj.reviews.count()


class CourseDetailSerializer(serializers.ModelSerializer):
    instructor = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.ReadOnlyField()
    enrollment_count = serializers.ReadOnlyField()
    cover_image = serializers.ReadOnlyField()
    total_duration_display = serializers.ReadOnlyField()
    is_enrolled = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    rating_breakdown = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'description', 'short_description',
            'what_you_learn', 'requirements',
            'cover_image', 'image_url', 'instructor', 'category',
            'level', 'language',
            'lessons', 'lesson_count', 'enrollment_count', 'total_duration_display',
            'is_enrolled', 'is_wishlisted', 'progress_percentage',
            'is_featured', 'is_published',
            'avg_rating', 'review_count', 'rating_breakdown', 'user_review',
            'created_at', 'updated_at',
        )

    def get_is_enrolled(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.enrollments.filter(user=req.user).exists()
        return False

    def get_is_wishlisted(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            return obj.wishlisted_by.filter(user=req.user).exists()
        return False

    def get_progress_percentage(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            e = obj.enrollments.filter(user=req.user).first()
            return e.progress_percentage if e else 0
        return 0

    def get_avg_rating(self, obj):
        r = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(r, 1) if r else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_rating_breakdown(self, obj):
        total = obj.reviews.count()
        if not total:
            return []
        result = []
        for star in range(5, 0, -1):
            count = obj.reviews.filter(rating=star).count()
            result.append({
                'star': star,
                'count': count,
                'percentage': round((count / total) * 100),
            })
        return result

    def get_user_review(self, obj):
        req = self.context.get('request')
        if req and req.user.is_authenticated:
            review = obj.reviews.filter(user=req.user).first()
            if review:
                return ReviewSerializer(review, context=self.context).data
        return None


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'description', 'short_description',
            'what_you_learn', 'requirements',
            'image', 'image_url', 'category', 'level', 'language',
            'is_published', 'is_featured',
        )

    def create(self, validated_data):
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Enrollment
        fields = ('id', 'course', 'enrolled_at', 'completed', 'completed_at',
                  'progress_percentage', 'last_accessed')


class WishlistSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'course', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'link', 'is_read', 'created_at')

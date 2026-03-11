from django.db import models
from django.db.models import Sum
from apps.users.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6366f1')

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Course(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    STATUS_DRAFT = 'draft'
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    what_you_learn = models.JSONField(default=list, blank=True)
    requirements = models.JSONField(default=list, blank=True)
    image = models.ImageField(upload_to='courses/', null=True, blank=True)
    image_url = models.URLField(blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    language = models.CharField(max_length=50, default='English')
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    admin_notes = models.TextField(blank=True, help_text='Admin feedback on course approval')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def enrollment_count(self):
        return self.enrollments.count()

    @property
    def cover_image(self):
        if self.image:
            return self.image.url
        return self.image_url or ''

    @property
    def total_duration_minutes(self):
        return self.lessons.aggregate(t=Sum('duration_minutes'))['t'] or 0

    @property
    def total_duration_display(self):
        mins = self.total_duration_minutes
        if mins < 60:
            return f"{mins}m"
        h = mins // 60
        m = mins % 60
        return f"{h}h {m}m" if m else f"{h}h"


class Module(models.Model):
    """Course section/module grouping lessons"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'modules'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.course.title} — {self.title}"

    @property
    def lesson_count(self):
        return self.lessons.count()


class Lesson(models.Model):
    LESSON_TYPE_VIDEO = 'video'
    LESSON_TYPE_TEXT = 'text'
    LESSON_TYPE_CHOICES = [
        (LESSON_TYPE_VIDEO, 'Video'),
        (LESSON_TYPE_TEXT, 'Text / Article'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True, related_name='lessons')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lesson_type = models.CharField(max_length=10, choices=LESSON_TYPE_CHOICES, default=LESSON_TYPE_VIDEO)
    youtube_url = models.URLField(blank=True, help_text='YouTube video URL or embed URL')
    text_content = models.TextField(blank=True, help_text='Markdown content for text lessons')
    order = models.PositiveIntegerField(default=0)
    duration_minutes = models.PositiveIntegerField(default=0)
    is_free_preview = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    @property
    def youtube_embed_url(self):
        url = self.youtube_url
        if not url:
            return ''
        if 'embed' in url:
            return url
        if 'youtu.be/' in url:
            video_id = url.split('youtu.be/')[-1].split('?')[0]
            return f'https://www.youtube.com/embed/{video_id}'
        if 'watch?v=' in url:
            video_id = url.split('watch?v=')[-1].split('&')[0]
            return f'https://www.youtube.com/embed/{video_id}'
        return url


class Review(models.Model):
    RATING_CHOICES = [(i, i) for i in range(1, 6)]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'
        unique_together = ('user', 'course')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} — {self.course.title} ({self.rating}★)"


class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.email} → {self.course.title}"

    @property
    def progress_percentage(self):
        total = self.course.lessons.count()
        if total == 0:
            return 0
        completed = self.user.lesson_progress.filter(
            lesson__course=self.course, completed=True
        ).count()
        return round((completed / total) * 100)


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='bookmarks')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ('user', 'lesson')
        ordering = ['-created_at']


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlists'
        unique_together = ('user', 'course')
        ordering = ['-created_at']


class Notification(models.Model):
    TYPE_CHOICES = [
        ('enrollment', 'Enrollment'),
        ('completion', 'Course Completion'),
        ('certificate', 'Certificate Issued'),
        ('quiz_passed', 'Quiz Passed'),
        ('streak', 'Learning Streak'),
        ('system', 'System'),
        ('course_approved', 'Course Approved'),
        ('course_rejected', 'Course Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

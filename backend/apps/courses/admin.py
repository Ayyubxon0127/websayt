from django.contrib import admin
from django.utils.html import format_html
from learnhub.custom_admin import admin_site
from .models import Category, Course, Lesson, Enrollment, Review


@admin.register(Category, site=admin_site)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'course_count')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

    def course_count(self, obj):
        return obj.courses.count()
    course_count.short_description = 'Courses'


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ('order', 'title', 'youtube_url', 'duration_minutes', 'is_free_preview')
    ordering = ('order',)
    show_change_link = True

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        # Set widget attrs for better inline layout
        form = formset.form
        if 'order' in form.base_fields:
            form.base_fields['order'].widget.attrs.update({'style': 'width:54px;text-align:center'})
        if 'title' in form.base_fields:
            form.base_fields['title'].widget.attrs.update({'style': 'width:100%', 'placeholder': 'Dars nomi'})
        if 'youtube_url' in form.base_fields:
            form.base_fields['youtube_url'].widget.attrs.update({'style': 'width:100%', 'placeholder': 'https://youtube.com/watch?v=...'})
        if 'duration_minutes' in form.base_fields:
            form.base_fields['duration_minutes'].widget.attrs.update({'style': 'width:64px;text-align:center'})
        return formset


@admin.register(Course, site=admin_site)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'instructor', 'category', 'level_badge',
        'published_badge', 'featured_badge', 'lesson_count_display',
        'enrollment_count_display', 'created_at'
    )
    list_filter = ('is_published', 'is_featured', 'level', 'category')
    search_fields = ('title', 'instructor__email', 'instructor__username')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ()
    readonly_fields = ('created_at', 'updated_at')
    inlines = [LessonInline]
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'slug', 'instructor', 'category', 'level')
        }),
        ('Content', {
            'fields': ('short_description', 'description', 'image', 'image_url')
        }),
        ('Publishing', {
            'fields': ('is_published', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def level_badge(self, obj):
        colors = {
            'beginner':     ('#dcfce7', '#15803d'),
            'intermediate': ('#dbeafe', '#1d4ed8'),
            'advanced':     ('#fee2e2', '#b91c1c'),
        }
        bg, fg = colors.get(obj.level, ('#f1f5f9', '#64748b'))
        return format_html(
            '<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;'
            'font-weight:700;background:{};color:{}">{}</span>',
            bg, fg, obj.get_level_display()
        )
    level_badge.short_description = 'Level'
    level_badge.admin_order_field = 'level'

    def published_badge(self, obj):
        if obj.is_published:
            return format_html('<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700;background:#dcfce7;color:#15803d">● Live</span>')
        return format_html('<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700;background:#f1f5f9;color:#64748b">○ Draft</span>')
    published_badge.short_description = 'Status'
    published_badge.admin_order_field = 'is_published'

    def featured_badge(self, obj):
        if obj.is_featured:
            return format_html('<span style="padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700;background:#fef3c7;color:#92400e">⭐ Yes</span>')
        return format_html('<span style="font-size:.72rem;color:#94a3b8">—</span>')
    featured_badge.short_description = 'Featured'
    featured_badge.admin_order_field = 'is_featured'

    def lesson_count_display(self, obj):
        return format_html(
            '<span style="font-weight:700;color:#4f46e5">{}</span>', obj.lesson_count
        )
    lesson_count_display.short_description = 'Lessons'

    def enrollment_count_display(self, obj):
        count = obj.enrollment_count
        color = '#22c55e' if count > 0 else '#94a3b8'
        return format_html(
            '<span style="font-weight:700;color:{}">{}</span>', color, count
        )
    enrollment_count_display.short_description = 'Students'


@admin.register(Lesson, site=admin_site)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'duration_minutes', 'is_free_preview')
    list_filter = ('course', 'is_free_preview')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order')
    list_select_related = ('course',)


@admin.register(Enrollment, site=admin_site)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at', 'completed', 'progress_display')
    list_filter = ('completed', 'course__category', 'course__level')
    search_fields = ('user__email', 'course__title')
    readonly_fields = ('enrolled_at', 'completed_at')
    list_select_related = ('user', 'course')

    def progress_display(self, obj):
        pct = obj.progress_percentage
        color = '#22c55e' if pct == 100 else '#f59e0b' if pct > 0 else '#6b7280'
        return format_html(
            '<span style="color:{};font-weight:600">{}%</span>', color, pct
        )
    progress_display.short_description = 'Progress'


@admin.register(Review, site=admin_site)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'rating_stars', 'comment_preview', 'created_at')
    list_filter = ('rating', 'course__category')
    search_fields = ('user__email', 'course__title', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('user', 'course')
    ordering = ('-created_at',)

    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        color = '#f59e0b'
        return format_html('<span style="color:{};font-size:16px">{}</span>', color, stars)
    rating_stars.short_description = 'Rating'

    def comment_preview(self, obj):
        return obj.comment[:80] + '...' if len(obj.comment) > 80 else obj.comment or '—'
    comment_preview.short_description = 'Comment'

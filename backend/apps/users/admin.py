from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from learnhub.custom_admin import admin_site
from .models import User


@admin.register(User, site=admin_site)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'full_name', 'is_instructor', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_instructor', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'avatar_preview')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('bio', 'avatar', 'avatar_preview', 'is_instructor')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" width="60" height="60" style="border-radius:50%;object-fit:cover">', obj.avatar.url)
        return '—'
    avatar_preview.short_description = 'Avatar Preview'

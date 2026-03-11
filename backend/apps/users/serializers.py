from rest_framework import serializers
from .models import User


class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    profile_avatar = serializers.ReadOnlyField()
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'full_name', 'profile_avatar', 'bio',
            'is_instructor', 'course_count', 'website', 'twitter', 'linkedin', 'location',
        )

    def get_course_count(self, obj):
        return obj.courses_taught.filter(is_published=True).count()


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    profile_avatar = serializers.ReadOnlyField()
    is_admin_role = serializers.ReadOnlyField()
    is_instructor_role = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'bio', 'avatar', 'avatar_url', 'profile_avatar',
            'role', 'is_instructor', 'is_staff',
            'is_admin_role', 'is_instructor_role',
            'instructor_approved', 'is_banned',
            'website', 'twitter', 'linkedin', 'location',
            'created_at',
        )
        read_only_fields = ('id', 'email', 'is_staff', 'created_at', 'full_name',
                            'profile_avatar', 'is_admin_role', 'is_instructor_role')


class UserAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    profile_avatar = serializers.ReadOnlyField()
    enrollment_count = serializers.SerializerMethodField()
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'profile_avatar', 'role', 'is_instructor', 'is_staff',
            'instructor_approved', 'is_banned', 'is_active',
            'enrollment_count', 'course_count',
            'date_joined', 'created_at',
        )

    def get_enrollment_count(self, obj):
        return obj.enrollments.count()

    def get_course_count(self, obj):
        return obj.courses_taught.count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.ROLE_STUDENT, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2', 'role')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        role = validated_data.get('role', User.ROLE_STUDENT)
        user = User(**validated_data)
        user.set_password(password)
        if role == User.ROLE_INSTRUCTOR:
            user.is_instructor = True
        user.save()
        return user

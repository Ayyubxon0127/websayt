import os

import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnhub.settings')
django.setup()

from django.contrib.auth import get_user_model


def main():
    email = os.getenv('DJANGO_SUPERUSER_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
    username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')

    if not email or not password:
        print('Bootstrap admin skipped: DJANGO_SUPERUSER_EMAIL/PASSWORD not set.')
        return

    User = get_user_model()
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': username,
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
        },
    )

    if not user.username:
        user.username = username

    user.role = 'admin'
    user.is_staff = True
    user.is_superuser = True
    user.set_password(password)
    user.save()

    print(f'Bootstrap admin ready: {email} (created={created})')


if __name__ == '__main__':
    main()
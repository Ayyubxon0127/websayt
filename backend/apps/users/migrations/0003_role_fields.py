from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_new_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=20,
                choices=[('student', 'Student'), ('instructor', 'Instructor'), ('admin', 'Admin')],
                default='student',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='is_banned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='instructor_approved',
            field=models.BooleanField(default=False),
        ),
    ]

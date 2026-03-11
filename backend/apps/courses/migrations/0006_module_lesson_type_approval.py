from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_wishlist_notification'),
    ]

    operations = [
        # Add Module model
        migrations.CreateModel(
            name='Module',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='modules', to='courses.course')),
            ],
            options={'db_table': 'modules', 'ordering': ['order', 'created_at']},
        ),
        # Add module FK to Lesson
        migrations.AddField(
            model_name='lesson',
            name='module',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lessons', to='courses.module'),
        ),
        # Add lesson_type
        migrations.AddField(
            model_name='lesson',
            name='lesson_type',
            field=models.CharField(
                choices=[('video', 'Video'), ('text', 'Text / Article')],
                default='video',
                max_length=10,
            ),
        ),
        # Add text_content
        migrations.AddField(
            model_name='lesson',
            name='text_content',
            field=models.TextField(blank=True, help_text='Markdown content for text lessons'),
        ),
        # Add approval_status to Course
        migrations.AddField(
            model_name='course',
            name='approval_status',
            field=models.CharField(
                choices=[('draft', 'Draft'), ('pending', 'Pending Approval'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                default='draft',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='course',
            name='admin_notes',
            field=models.TextField(blank=True, help_text='Admin feedback on course approval'),
        ),
        # Add is_flagged to Review
        migrations.AddField(
            model_name='review',
            name='is_flagged',
            field=models.BooleanField(default=False),
        ),
    ]

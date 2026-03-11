from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('courses', '0004_bookmark'),
    ]
    operations = [
        migrations.CreateModel(
            name='Wishlist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey('users.User', on_delete=django.db.models.deletion.CASCADE, related_name='wishlists')),
                ('course', models.ForeignKey('courses.Course', on_delete=django.db.models.deletion.CASCADE, related_name='wishlisted_by')),
            ],
            options={'db_table': 'wishlists', 'ordering': ['-created_at'], 'unique_together': {('user', 'course')}},
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('type', models.CharField(max_length=20, default='system')),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField(blank=True)),
                ('link', models.CharField(max_length=255, blank=True)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey('users.User', on_delete=django.db.models.deletion.CASCADE, related_name='notifications')),
            ],
            options={'db_table': 'notifications', 'ordering': ['-created_at']},
        ),
        migrations.AddField(model_name='course', name='what_you_learn', field=models.JSONField(default=list, blank=True)),
        migrations.AddField(model_name='course', name='requirements', field=models.JSONField(default=list, blank=True)),
        migrations.AddField(model_name='course', name='language', field=models.CharField(max_length=50, default='English')),
        migrations.AddField(model_name='lesson', name='is_locked', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='enrollment', name='last_accessed', field=models.DateTimeField(null=True, blank=True)),
        migrations.AddField(model_name='bookmark', name='note', field=models.TextField(blank=True)),
    ]


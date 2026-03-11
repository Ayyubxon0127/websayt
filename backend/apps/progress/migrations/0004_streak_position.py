from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('progress', '0003_certificate'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='LearningStreak',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('current_streak', models.PositiveIntegerField(default=0)),
                ('longest_streak', models.PositiveIntegerField(default=0)),
                ('last_activity_date', models.DateField(blank=True, null=True)),
                ('total_days_learned', models.PositiveIntegerField(default=0)),
                ('total_lessons_completed', models.PositiveIntegerField(default=0)),
                ('total_watch_minutes', models.PositiveIntegerField(default=0)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='streak',
                    to='users.user'
                )),
            ],
            options={'db_table': 'learning_streaks'},
        ),
        migrations.AddField(
            model_name='lessonprogress',
            name='last_position_seconds',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='lessonprogress',
            name='watch_time_seconds',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

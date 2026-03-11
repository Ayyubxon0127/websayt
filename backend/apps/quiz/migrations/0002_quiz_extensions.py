from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='quiz',
            name='time_limit_minutes',
            field=models.PositiveSmallIntegerField(default=0, help_text='0 = no limit'),
        ),
        migrations.AddField(
            model_name='quiz',
            name='max_attempts',
            field=models.PositiveSmallIntegerField(default=0, help_text='0 = unlimited'),
        ),
        migrations.AddField(
            model_name='question',
            name='question_type',
            field=models.CharField(
                choices=[('multiple', 'Multiple Choice'), ('truefalse', 'True / False')],
                default='multiple',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='explanation',
            field=models.TextField(blank=True, help_text='Explanation shown after answering'),
        ),
        migrations.AddField(
            model_name='userquizattempt',
            name='time_taken_seconds',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

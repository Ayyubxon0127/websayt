from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0006_module_lesson_type_approval'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='category',
            name='color',
            field=models.CharField(max_length=7, default='#6366f1'),
        ),
    ]

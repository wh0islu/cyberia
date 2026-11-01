from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0005_remove_profile_photo_profile_pfp_alter_course_cover'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='actual_page',
            field=models.PositiveIntegerField(default=0, help_text='Actual page reading'),
        ),
    ]

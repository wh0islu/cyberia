from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0013_alter_mealentry_category_choices'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='tmdb_poster_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='series',
            name='tmdb_poster_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]

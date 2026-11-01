from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0014_movie_series_tmdb_poster_path'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='genre',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='series',
            name='genre',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

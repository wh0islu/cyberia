from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0015_movie_series_genre'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='current_minute',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='series',
            name='current_episode',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='series',
            name='current_season',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]

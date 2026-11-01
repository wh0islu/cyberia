from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0023_movie_series_tmdb_synopsis'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='name',
            field=models.CharField(help_text='Mr Penguin', max_length=60),
        ),
    ]

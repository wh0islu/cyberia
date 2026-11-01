from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0022_book_last_read_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='tmdb_synopsis',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='series',
            name='tmdb_synopsis',
            field=models.TextField(blank=True, default=''),
        ),
    ]

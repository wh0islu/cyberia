import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_rename_book_status_book_status_alter_book_language'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Python 3.15 programming course', max_length=255)),
                ('instructor', models.CharField(blank=True, help_text='Lorem', max_length=255, null=True)),
                ('platform', models.CharField(blank=True, max_length=100, null=True)),
                ('number_of_lessons', models.PositiveIntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[('NS', 'NOT STARTED'), ('IP', 'IN PROGRESS'), ('CD', 'COMPLETED'), ('PA', 'PAUSED'), ('RY', 'REVIEWING')], default='NS', max_length=2)),
                ('language', models.CharField(blank=True, choices=[('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')], max_length=2, null=True)),
                ('url', models.URLField(blank=True, null=True)),
                ('cover', models.ImageField(blank=True, null=True, upload_to='coursers/covers/')),
                ('certificate_available', models.BooleanField(default=False)),
                ('certificate_obtained', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Movie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('year', models.PositiveIntegerField(blank=True, null=True)),
                ('director', models.CharField(blank=True, max_length=100, null=True)),
                ('status', models.CharField(choices=[('NW', 'NOT WATCHED'), ('WG', 'WATCHING'), ('PA', 'PAUSED'), ('RW', 'REWATCHING'), ('WT', 'WATCHED')], max_length=3)),
                ('language', models.CharField(blank=True, choices=[('PT', 'PORTUGUESE'), ('EN', 'ENGLISH'), ('RU', 'RUSSIAN'), ('CH', 'CHINESE')], max_length=2, null=True)),
                ('imdb_id', models.CharField(blank=True, max_length=20, null=True)),
                ('tmdb_id', models.PositiveIntegerField(blank=True, null=True)),
                ('cover', models.ImageField(blank=True, null=True, upload_to='movies/covers/')),
            ],
        ),
        migrations.AddField(
            model_name='book',
            name='cover',
            field=models.ImageField(blank=True, null=True, upload_to='books/covers/'),
        ),
        migrations.AlterField(
            model_name='book',
            name='number_of_pages',
            field=models.PositiveIntegerField(blank=True, help_text='Number of pages', null=True),
        ),
        migrations.CreateModel(
            name='CourseSource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('format', models.CharField(choices=[('WEB', 'ONLINE'), ('VID', 'VIDEO'), ('LOC', 'LOCAL FILES')], max_length=3)),
                ('location', models.CharField(blank=True, max_length=255, null=True)),
                ('url', models.URLField(blank=True, null=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='base.course')),
            ],
        ),
        migrations.CreateModel(
            name='MovieSource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('format', models.CharField(blank=True, choices=[('STR', 'STREAMING'), ('FILE', 'LOCAL FILE'), ('DVD', 'DVD'), ('BR', 'BLU-RAY')], max_length=4, null=True)),
                ('location', models.CharField(blank=True, max_length=500, null=True)),
                ('url', models.URLField(blank=True, null=True)),
                ('movie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='base.movie')),
            ],
        ),
    ]

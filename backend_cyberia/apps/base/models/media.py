from django.db import models


class Movie(models.Model):
    MOVIE_OPTIONS = [
        ('NW', 'NOT WATCHED'),
        ('WG', 'WATCHING'),
        ('PA', 'PAUSED'),
        ('RW', 'REWATCHING'),
        ('WT', 'WATCHED'),
    ]

    LANGUAGE_OPTIONS = [('PT', 'PORTUGUESE'), ('EN', 'ENGLISH'), ('RU', 'RUSSIAN'), ('CH', 'CHINESE')]

    title = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, blank=True)
    year = models.PositiveIntegerField(blank=True, null=True)
    director = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=3, choices=MOVIE_OPTIONS)
    current_minute = models.PositiveIntegerField(blank=True, null=True)
    language = models.CharField(max_length=2, blank=True, null=True, choices=LANGUAGE_OPTIONS)
    imdb_id = models.CharField(max_length=20, blank=True, null=True)
    tmdb_id = models.PositiveIntegerField(blank=True, null=True)
    tmdb_poster_path = models.CharField(max_length=255, blank=True, null=True)
    tmdb_synopsis = models.TextField(blank=True, default='')
    cover = models.ImageField(upload_to='movies/covers/', blank=True, null=True)

    def __str__(self):
        return f'{self.title}'


class MovieSource(models.Model):
    FORMAT_OPTIONS = [
        ('STR', 'STREAMING'),
        ('FILE', 'LOCAL FILE'),
        ('DVD', 'DVD'),
        ('BR', 'BLU-RAY'),
    ]
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='sources')
    format = models.CharField(max_length=4, blank=True, null=True, choices=FORMAT_OPTIONS)
    location = models.CharField(max_length=500, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.movie.title} - {self.format}'


class Series(models.Model):
    SERIES_OPTIONS = [
        ('NW', 'NOT WATCHED'),
        ('WT', 'WATCHING'),
        ('WD', 'WATCHED'),
        ('PA', 'PAUSED'),
        ('RW', 'REWATCHING'),
    ]

    title = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, blank=True)
    original_title = models.CharField(max_length=255, blank=True, null=True)
    start_year = models.PositiveIntegerField(blank=True, null=True)
    end_year = models.PositiveIntegerField(blank=True, null=True)
    number_of_seasons = models.PositiveIntegerField(blank=True, null=True)
    number_of_episodes = models.PositiveIntegerField(blank=True, null=True)
    current_season = models.PositiveIntegerField(blank=True, null=True)
    current_episode = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=2,
        default='NW',
        choices=SERIES_OPTIONS,
    )
    imdb_id = models.CharField(max_length=20, blank=True, null=True)
    tmdb_id = models.PositiveIntegerField(blank=True, null=True)
    tmdb_poster_path = models.CharField(max_length=255, blank=True, null=True)
    tmdb_synopsis = models.TextField(blank=True, default='')
    cover = models.ImageField(upload_to='series/covers/', blank=True, null=True)

    def __str__(self):
        return f'{self.title}'


class SeriesSource(models.Model):
    FORMAT_OPTIONS = [
        ('STR', 'STREAMING'),
        ('FILE', 'LOCAL FILE'),
        ('DVD', 'DVD'),
        ('BR', 'BLU-RAY'),
    ]

    series = models.ForeignKey(
        Series,
        on_delete=models.CASCADE,
        related_name='sources',
    )

    format = models.CharField(
        max_length=4,
        choices=FORMAT_OPTIONS,
    )

    location = models.CharField(max_length=500, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.series.title} - {self.format}'

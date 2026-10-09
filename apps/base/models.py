from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=60, help_text='Mr Penguim')
    bio = models.TextField(null=True)
    nationality = models.CharField(max_length=10, help_text='Siberian')
    goals = models.CharField(max_length=100, help_text='Help people.', blank=True)
    message = models.TextField(null=True, help_text='Be humble.')
    photo = models.ImageField(upload_to='perfil/', blank=True, null=True)

    def __str__(self):
        return f"{self.name}'s profile"


class SeedWord(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    index = models.PositiveIntegerField()
    word_hash = models.CharField(max_length=128)

    class Meta:
        unique_together = ('profile', 'index')

    def __str__(self):
        return f'{self.profile.name} - word {self.index}'


class Book(models.Model):
    BOOK_OPTIONS = [
        ('RE', 'READING'),
        ('NR', 'NOT READING'),
        ('FD', 'FINISHED'),
        ('RW', 'REVIEWING'),
    ]

    LANGUAGE_OPTIONS = [('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')]

    title = models.CharField(max_length=100, help_text="Book's title")
    author = models.CharField(max_length=100, help_text="Author's name")
    year = models.IntegerField(blank=True, null=True, help_text='Year of the book')
    number_of_pages = models.PositiveIntegerField(blank=True, null=True, help_text='Number of pages')
    status = models.CharField(null=True, default='NR', choices=BOOK_OPTIONS)
    language = models.CharField(null=True, blank=True, choices=LANGUAGE_OPTIONS)
    cover = models.ImageField(upload_to='books/covers/', blank=True, null=True)

    def __str__(self):
        return f'{self.title} - {self.author}'


class BookSource(models.Model):
    FORMAT_OPTIONS = [
        ('PH', 'PHYSICAL'),
        ('PDF', 'PDF'),
        ('EPUB', 'EPUB'),
        ('WEB', 'ONLINE'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='sources')
    format = models.CharField(max_length=4, null=True, choices=FORMAT_OPTIONS)
    location = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.book.title} - {self.book.author} - {self.format}'


class Course(models.Model):
    COURSE_OPTIONS = [
        ('NS', 'NOT STARTED'),
        ('IP', 'IN PROGRESS'),
        ('CD', 'COMPLETED'),
        ('PA', 'PAUSED'),
        ('RY', 'REVIEWING'),
    ]
    LANGUAGE_OPTIONS = [('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')]

    title = models.CharField(max_length=255, help_text='Python 3.15 programming course')
    instructor = models.CharField(max_length=255, blank=True, null=True, help_text='Lorem')
    platform = models.CharField(max_length=100, blank=True, null=True)
    number_of_lessons = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(max_length=2, default='NS', choices=COURSE_OPTIONS)
    language = models.CharField(max_length=2, blank=True, null=True, choices=LANGUAGE_OPTIONS)
    url = models.URLField(blank=True, null=True)
    cover = models.ImageField(upload_to='courses/covers/', blank=True, null=True)
    certificate_available = models.BooleanField(default=False)
    certificate_obtained = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.title} - {self.platform}'


class CourseSource(models.Model):
    FORMAT_OPTIONS = [('WEB', 'ONLINE'), ('VID', 'VIDEO'), ('LOC', 'LOCAL FILES')]
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sources')
    format = models.CharField(max_length=3, choices=FORMAT_OPTIONS)
    location = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.course.title} - {self.course.platform}'


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
    year = models.PositiveIntegerField(blank=True, null=True)
    director = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=3, choices=MOVIE_OPTIONS)
    language = models.CharField(max_length=2, blank=True, null=True, choices=LANGUAGE_OPTIONS)
    imdb_id = models.CharField(max_length=20, blank=True, null=True)
    tmdb_id = models.PositiveIntegerField(blank=True, null=True)
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
    original_title = models.CharField(max_length=255, blank=True, null=True)
    start_year = models.PositiveIntegerField(blank=True, null=True)
    end_year = models.PositiveIntegerField(blank=True, null=True)
    number_of_seasons = models.PositiveIntegerField(blank=True, null=True)
    number_of_episodes = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=2,
        default='NW',
        choices=SERIES_OPTIONS,
    )
    imdb_id = models.CharField(max_length=20, blank=True, null=True)
    tmdb_id = models.PositiveIntegerField(blank=True, null=True)
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

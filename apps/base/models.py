from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=60, help_text='Mr Penguim')
    bio = models.TextField(null=True)
    nationality = models.CharField(max_length=10, help_text='Siberian')
    goals = models.CharField(max_length=100, help_text='Help people.', blank=True)
    message = models.TextField(null=True, help_text='Be humble.')
    pfp = models.ImageField(upload_to='profile/pfp/', blank=True, null=True)

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
    GENRE_OPTIONS = [
        ('FI', 'Fiction'),
        ('TC', 'Technical'),
        ('FA', 'Fantasy'),
        ('SF', 'Science fiction'),
        ('HI', 'Historical'),
        ('BI', 'Biography'),
        ('NF', 'Non-fiction'),
        ('OT', 'Other'),
    ]

    title = models.CharField(max_length=100, help_text="Book's title")
    author = models.CharField(max_length=100, help_text="Author's name")
    genre = models.CharField(max_length=2, choices=GENRE_OPTIONS, blank=True)
    year = models.IntegerField(blank=True, null=True, help_text='Year of the book')
    number_of_pages = models.PositiveIntegerField(blank=True, null=True, help_text='Number of pages')
    current_page = models.PositiveIntegerField(default=0, help_text='Actual page reading')
    started_on = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
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


class MealEntry(models.Model):
    MEAL_OPTIONS = [
        ('BR', 'Breakfast'),
        ('LU', 'Lunch'),
        ('SN', 'Snack'),
        ('DI', 'Dinner'),
        ('OT', 'Other'),
    ]
    TAG_OPTIONS = [
        ('home', 'Homemade'),
        ('out', 'Eating out'),
        ('delivery', 'Delivery'),
        ('quick', 'Quick'),
        ('healthy', 'Healthy'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_entries')
    category = models.CharField(max_length=2, choices=MEAL_OPTIONS)
    date = models.DateField(default=timezone.localdate)
    time = models.TimeField(blank=True, null=True)
    photo = models.ImageField(upload_to='meals/photos/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.get_category_display()} - {self.date}'


class MealItem(models.Model):
    meal = models.ForeignKey(MealEntry, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name


class Habit(models.Model):
    LINKED_SECTION_OPTIONS = [
        ('books', 'Books'),
        ('courses', 'Courses'),
        ('meals', 'Meals'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=150)
    weekdays = models.JSONField(default=list)
    time = models.TimeField(blank=True, null=True)
    goal = models.CharField(max_length=255, blank=True)
    linked_section = models.CharField(
        max_length=10,
        choices=LINKED_SECTION_OPTIONS,
        blank=True,
        null=True,
    )
    reminder = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HabitCompletion(models.Model):
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    date = models.DateField()
    completed = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['habit', 'date'],
                name='unique_habit_completion_per_day',
            ),
        ]

    def __str__(self):
        return f'{self.habit.name} - {self.date}'


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
    genre = models.CharField(max_length=100, blank=True)
    year = models.PositiveIntegerField(blank=True, null=True)
    director = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=3, choices=MOVIE_OPTIONS)
    current_minute = models.PositiveIntegerField(blank=True, null=True)
    language = models.CharField(max_length=2, blank=True, null=True, choices=LANGUAGE_OPTIONS)
    imdb_id = models.CharField(max_length=20, blank=True, null=True)
    tmdb_id = models.PositiveIntegerField(blank=True, null=True)
    tmdb_poster_path = models.CharField(max_length=255, blank=True, null=True)
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

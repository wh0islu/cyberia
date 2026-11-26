"""Activity events: one row per item per day on which progress moved forward.

The Book/Movie/Series/Course models keep only the *current* position
(current_page, current_minute, ...), which is overwritten on every update and
therefore cannot answer "when did I make progress?". These models keep that
history, following the same pattern as HabitCompletion. Several updates on the
same day are merged into a single session (its `to_*` value moves forward).
"""

from django.db import models


class ReadingSession(models.Model):
    book = models.ForeignKey('Book', on_delete=models.CASCADE, related_name='reading_sessions')
    date = models.DateField()
    from_page = models.PositiveIntegerField()
    to_page = models.PositiveIntegerField()

    class Meta:
        ordering = ['date', 'id']
        constraints = [
            models.UniqueConstraint(fields=['book', 'date'], name='unique_reading_session_per_day'),
        ]

    def __str__(self):
        return f'{self.book.title} - {self.date} (p. {self.from_page}-{self.to_page})'


class MovieWatchSession(models.Model):
    movie = models.ForeignKey('Movie', on_delete=models.CASCADE, related_name='watch_sessions')
    date = models.DateField()
    from_minute = models.PositiveIntegerField()
    to_minute = models.PositiveIntegerField()

    class Meta:
        ordering = ['date', 'id']
        constraints = [
            models.UniqueConstraint(fields=['movie', 'date'], name='unique_movie_watch_session_per_day'),
        ]

    def __str__(self):
        return f'{self.movie.title} - {self.date} (min {self.from_minute}-{self.to_minute})'


class SeriesWatchSession(models.Model):
    series = models.ForeignKey('Series', on_delete=models.CASCADE, related_name='watch_sessions')
    date = models.DateField()
    from_season = models.PositiveIntegerField()
    from_episode = models.PositiveIntegerField()
    to_season = models.PositiveIntegerField()
    to_episode = models.PositiveIntegerField()

    class Meta:
        ordering = ['date', 'id']
        constraints = [
            models.UniqueConstraint(fields=['series', 'date'], name='unique_series_watch_session_per_day'),
        ]

    def __str__(self):
        return f'{self.series.title} - {self.date} (S{self.to_season}E{self.to_episode})'


class StudySession(models.Model):
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='study_sessions')
    date = models.DateField()
    from_lesson = models.PositiveIntegerField()
    to_lesson = models.PositiveIntegerField()

    class Meta:
        ordering = ['date', 'id']
        constraints = [
            models.UniqueConstraint(fields=['course', 'date'], name='unique_study_session_per_day'),
        ]

    def __str__(self):
        return f'{self.course.title} - {self.date} (lessons {self.from_lesson}-{self.to_lesson})'

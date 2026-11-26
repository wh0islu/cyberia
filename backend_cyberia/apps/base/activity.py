"""Record activity sessions when an item's progress moves forward.

Called from the serializers' `update()`, inside the same transaction as the
progress change, so a session is never saved for an update that failed.
"""

from django.utils import timezone

from apps.base.models import MovieWatchSession, ReadingSession, SeriesWatchSession, StudySession


def _record(session_model, parent_field, parent, start, end, from_fields, to_fields):
    """Create today's session for `parent`, or move an existing one forward.

    `start`/`end` are the old and new positions, as tuples so that
    (season, episode) compares correctly. Nothing is recorded unless the
    position advanced: corrections backwards are edits, not activity.
    """
    if end <= start:
        return
    today = timezone.localdate()
    session = session_model.objects.filter(**{parent_field: parent, 'date': today}).first()
    if session is None:
        session_model.objects.create(
            **{parent_field: parent, 'date': today},
            **dict(zip(from_fields, start, strict=True)),
            **dict(zip(to_fields, end, strict=True)),
        )
        return
    # Same day: keep the original starting point, only extend the end.
    current_end = tuple(getattr(session, field) for field in to_fields)
    if end > current_end:
        for field, value in zip(to_fields, end, strict=True):
            setattr(session, field, value)
        session.save(update_fields=list(to_fields))


def record_reading(book, old_page, new_page):
    _record(ReadingSession, 'book', book, (old_page or 0,), (new_page or 0,),
            ('from_page',), ('to_page',))


def record_movie(movie, old_minute, new_minute):
    _record(MovieWatchSession, 'movie', movie, (old_minute or 0,), (new_minute or 0,),
            ('from_minute',), ('to_minute',))


def record_series(series, old_position, new_position):
    """Positions are (season, episode); a missing value counts as 0."""
    start = tuple(value or 0 for value in old_position)
    end = tuple(value or 0 for value in new_position)
    _record(SeriesWatchSession, 'series', series, start, end,
            ('from_season', 'from_episode'), ('to_season', 'to_episode'))


def record_study(course, old_lessons, new_lessons):
    _record(StudySession, 'course', course, (old_lessons or 0,), (new_lessons or 0,),
            ('from_lesson',), ('to_lesson',))

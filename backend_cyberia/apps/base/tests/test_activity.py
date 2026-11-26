from datetime import date, datetime
from importlib import import_module
from unittest.mock import patch

from django.apps import apps as django_apps
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.models import (
    Book,
    Course,
    Movie,
    MovieWatchSession,
    ReadingSession,
    Series,
    SeriesWatchSession,
    StudySession,
)

TODAY = date(2026, 11, 20)
TOMORROW = date(2026, 11, 21)


def on_day(day):
    """Freeze the calendar day used to file sessions."""
    return patch('apps.base.activity.timezone.localdate', return_value=day)


class ReadingSessionTests(APITestCase):
    def setUp(self):
        self.book = Book.objects.create(
            title='Dune', author='Frank Herbert', number_of_pages=600, current_page=100, status='RE',
        )
        self.url = reverse('base:book_api', args=[self.book.pk])

    def patch_page(self, page):
        response = self.client.patch(self.url, {'current_page': page}, format='json')
        assert response.status_code == status.HTTP_200_OK, response.data

    def test_forward_progress_creates_a_session(self):
        with on_day(TODAY):
            self.patch_page(140)
        session = ReadingSession.objects.get()
        assert (session.date, session.from_page, session.to_page) == (TODAY, 100, 140)

    def test_updates_on_the_same_day_extend_one_session(self):
        with on_day(TODAY):
            self.patch_page(140)
            self.patch_page(180)
        session = ReadingSession.objects.get()
        assert (session.from_page, session.to_page) == (100, 180)

    def test_a_new_day_starts_a_new_session(self):
        with on_day(TODAY):
            self.patch_page(140)
        with on_day(TOMORROW):
            self.patch_page(170)
        sessions = list(ReadingSession.objects.values_list('date', 'from_page', 'to_page'))
        assert sessions == [(TODAY, 100, 140), (TOMORROW, 140, 170)]

    def test_moving_backwards_is_an_edit_not_activity(self):
        with on_day(TODAY):
            self.patch_page(80)
        assert not ReadingSession.objects.exists()

    def test_a_correction_on_the_same_day_does_not_shrink_the_session(self):
        with on_day(TODAY):
            self.patch_page(180)
            self.patch_page(150)
        assert ReadingSession.objects.get().to_page == 180

    def test_editing_other_fields_records_nothing(self):
        with on_day(TODAY):
            response = self.client.patch(self.url, {'notes': 'Great so far'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert not ReadingSession.objects.exists()

    def test_deleting_the_book_deletes_its_sessions(self):
        with on_day(TODAY):
            self.patch_page(140)
        self.client.delete(self.url)
        assert not ReadingSession.objects.exists()


class WatchAndStudySessionTests(APITestCase):
    def test_movie_minutes_forward_create_a_session(self):
        movie = Movie.objects.create(title='Arrival', status='WG', current_minute=10)
        with on_day(TODAY):
            self.client.patch(reverse('base:movie_api', args=[movie.pk]), {'current_minute': 62}, format='json')
        session = MovieWatchSession.objects.get()
        assert (session.from_minute, session.to_minute) == (10, 62)

    def test_next_season_counts_as_progress_even_with_a_lower_episode(self):
        series = Series.objects.create(title='Dark', status='WT', current_season=1, current_episode=10)
        with on_day(TODAY):
            self.client.patch(
                reverse('base:series_detail_api', args=[series.pk]),
                {'current_season': 2, 'current_episode': 1},
                format='json',
            )
        session = SeriesWatchSession.objects.get()
        assert (session.from_season, session.from_episode, session.to_season, session.to_episode) == (1, 10, 2, 1)

    def test_first_episode_ever_is_progress_from_nothing(self):
        series = Series.objects.create(title='Dark', status='WT')
        with on_day(TODAY):
            self.client.patch(
                reverse('base:series_detail_api', args=[series.pk]),
                {'current_season': 1, 'current_episode': 1},
                format='json',
            )
        assert SeriesWatchSession.objects.get().from_season == 0

    def test_completed_lessons_forward_create_a_study_session(self):
        course = Course.objects.create(title='SQL', number_of_lessons=40, completed_lessons=3)
        with on_day(TODAY):
            self.client.patch(reverse('base:course_api', args=[course.pk]), {'completed_lessons': 5}, format='json')
        session = StudySession.objects.get()
        assert (session.from_lesson, session.to_lesson) == (3, 5)


class SessionEndpointTests(APITestCase):
    def test_sessions_are_listed(self):
        book = Book.objects.create(title='Dune', author='Frank Herbert')
        ReadingSession.objects.create(book=book, date=TODAY, from_page=0, to_page=30)
        response = self.client.get(reverse('base:reading_sessions_api'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data == [{'id': response.data[0]['id'], 'book': book.pk, 'date': '2026-11-20',
                                  'from_page': 0, 'to_page': 30}]

    def test_session_endpoints_are_read_only(self):
        for name in ('reading_sessions_api', 'movie_sessions_api', 'series_sessions_api', 'study_sessions_api'):
            response = self.client.post(reverse(f'base:{name}'), {}, format='json')
            assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED, name


class BackfillMigrationTests(APITestCase):
    def test_last_read_at_becomes_one_reading_session(self):
        migration = import_module('apps.base.migrations.0028_activity_sessions')
        read_at = timezone.make_aware(datetime(2026, 10, 5, 21, 0))
        book = Book.objects.create(title='Dune', author='Frank Herbert', current_page=250, last_read_at=read_at)
        Book.objects.create(title='Unread', author='Someone')

        migration.backfill_reading_sessions(django_apps, None)

        session = ReadingSession.objects.get()
        assert (session.book_id, session.date, session.from_page, session.to_page) == (
            book.pk, date(2026, 10, 5), 250, 250,
        )

from apps.base.models import (
    Book,
    BookSource,
    Course,
    CourseSource,
    Habit,
    HabitCompletion,
    MealEntry,
    MealItem,
    Movie,
    MovieSource,
    Series,
    SeriesSource,
)
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CollectionDeletionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='deletion-test', password='test-password')
        self.client.force_authenticate(self.user)

    def test_delete_items_and_related_records(self):
        book = Book.objects.create(title='Book', author='Author')
        BookSource.objects.create(book=book, format='PH')
        movie = Movie.objects.create(title='Movie', status='NW')
        MovieSource.objects.create(movie=movie, format='STR')
        series = Series.objects.create(title='Series')
        SeriesSource.objects.create(series=series, format='STR')
        course = Course.objects.create(title='Course')
        CourseSource.objects.create(course=course, format='WEB')
        meal = MealEntry.objects.create(user=self.user, category='LU')
        MealItem.objects.create(meal=meal, name='Rice')
        habit = Habit.objects.create(user=self.user, name='Habit', weekdays=[0])
        HabitCompletion.objects.create(habit=habit, date='2026-11-02')
        cases = [
            (book, 'book_api', BookSource, 'book_id'),
            (movie, 'movie_api', MovieSource, 'movie_id'),
            (series, 'series_detail_api', SeriesSource, 'series_id'),
            (course, 'course_api', CourseSource, 'course_id'),
            (meal, 'meal_api', MealItem, 'meal_id'),
            (habit, 'habit_api', HabitCompletion, 'habit_id'),
        ]
        for item, route, related_model, parent in cases:
            with self.subTest(route=route):
                pk = item.pk
                response = self.client.delete(reverse(f'base:{route}', args=[pk]))
                assert response.status_code == status.HTTP_204_NO_CONTENT
                assert response.content == b''
                assert not type(item).objects.filter(pk=pk).exists()
                assert not related_model.objects.filter(**{parent: pk}).exists()

    def test_cannot_delete_another_users_habit_or_meal(self):
        other = User.objects.create_user(username='other-owner', password='test-password')
        habit = Habit.objects.create(user=other, name='Private habit', weekdays=[0])
        meal = MealEntry.objects.create(user=other, category='LU')
        for item, route in [(habit, 'habit_api'), (meal, 'meal_api')]:
            with self.subTest(route=route):
                response = self.client.delete(reverse(f'base:{route}', args=[item.pk]))
                assert response.status_code == status.HTTP_404_NOT_FOUND
                assert type(item).objects.filter(pk=item.pk).exists()

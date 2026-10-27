from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.base.models import (
    Book,
    Course,
    Habit,
    HabitCompletion,
    MealEntry,
    Movie,
    Series,
)
from apps.base.serializers import (
    BookSerializer,
    BooksSerializer,
    CourseSerializer,
    HabitCompletionSerializer,
    HabitSerializer,
    MealEntrySerializer,
    MovieSerializer,
    SeriesSerializer,
)


# Books
@api_view(http_method_names=['GET', 'POST'])
def books_api_collection(request):
    if request.method == 'GET':
        books = Book.objects.all()
        serializer = BooksSerializer(instance=books, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BookSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def book_api(request, pk):
    book = get_object_or_404(Book.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = BookSerializer(instance=book, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = BookSerializer(
            instance=book,
            data=request.data,
            context={'request': request},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Movies
@api_view(http_method_names=['GET', 'POST'])
def movies_api_collection(request):
    if request.method == 'GET':
        serializer = MovieSerializer(Movie.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MovieSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def movie_api(request, pk):
    movie = get_object_or_404(Movie.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = MovieSerializer(movie, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MovieSerializer(
            movie,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        movie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Series
@api_view(http_method_names=['GET', 'POST'])
def series_api_collection(request):
    if request.method == 'GET':
        serializer = SeriesSerializer(Series.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SeriesSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def series_api(request, pk):
    series = get_object_or_404(Series.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = SeriesSerializer(series, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = SeriesSerializer(
            series,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        series.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Meals
@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meals_api_collection(request):
    if request.method == 'GET':
        meals = MealEntry.objects.filter(user=request.user).prefetch_related('items')
        serializer = MealEntrySerializer(meals, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MealEntrySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def meal_api(request, pk):
    meal = get_object_or_404(
        MealEntry.objects.filter(user=request.user).prefetch_related('items'),
        pk=pk,
    )

    if request.method == 'GET':
        serializer = MealEntrySerializer(meal, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MealEntrySerializer(
            meal,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        meal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Courses
@api_view(http_method_names=['GET', 'POST'])
def courses_api_collection(request):
    if request.method == 'GET':
        serializer = CourseSerializer(Course.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CourseSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def course_api(request, pk):
    course = get_object_or_404(Course.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = CourseSerializer(course, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = CourseSerializer(
            course,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Routine — habits
@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habits_api_collection(request):
    if request.method == 'GET':
        habits = Habit.objects.filter(user=request.user).prefetch_related('completions')
        serializer = HabitSerializer(habits, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HabitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        habit = serializer.save(user=request.user)
        return Response(HabitSerializer(habit).data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_api(request, pk):
    habit = get_object_or_404(
        Habit.objects.filter(user=request.user).prefetch_related('completions'),
        pk=pk,
    )

    if request.method == 'GET':
        return Response(HabitSerializer(habit).data)

    elif request.method == 'PATCH':
        serializer = HabitSerializer(
            habit,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return Response(HabitSerializer(habit).data)

    elif request.method == 'DELETE':
        habit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Routine — daily habit completions
@api_view(http_method_names=['GET', 'POST'])
@permission_classes([IsAuthenticated])
def habit_completions_api_collection(request):
    if request.method == 'GET':
        completions = HabitCompletion.objects.filter(
            habit__user=request.user,
        ).select_related('habit')
        serializer = HabitCompletionSerializer(completions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HabitCompletionSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        completion = serializer.save()
        return Response(
            HabitCompletionSerializer(completion).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def habit_completion_api(request, pk):
    completion = get_object_or_404(
        HabitCompletion.objects.filter(habit__user=request.user).select_related('habit'),
        pk=pk,
    )

    if request.method == 'GET':
        return Response(HabitCompletionSerializer(completion).data)

    elif request.method == 'PATCH':
        serializer = HabitCompletionSerializer(
            completion,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        completion = serializer.save()
        return Response(HabitCompletionSerializer(completion).data)

    elif request.method == 'DELETE':
        completion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

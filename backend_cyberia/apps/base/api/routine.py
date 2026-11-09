from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import Habit, HabitCompletion
from apps.base.serializers import HabitCompletionSerializer, HabitSerializer


@api_view(http_method_names=['GET', 'POST'])
def habits_api_collection(request):
    if request.method == 'GET':
        habits = Habit.objects.prefetch_related('completions').all()
        serializer = HabitSerializer(habits, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HabitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return Response(HabitSerializer(habit).data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def habit_api(request, pk):
    habit = get_object_or_404(
        Habit.objects.prefetch_related('completions'),
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


@api_view(http_method_names=['GET', 'POST'])
def habit_completions_api_collection(request):
    if request.method == 'GET':
        completions = HabitCompletion.objects.select_related('habit').all()
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
def habit_completion_api(request, pk):
    completion = get_object_or_404(
        HabitCompletion.objects.select_related('habit'),
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

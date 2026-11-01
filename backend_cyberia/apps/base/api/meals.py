from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import MealEntry, MealNote
from apps.base.serializers import MealEntrySerializer, MealNoteSerializer

from .request_data import _meal_request_data


@api_view(http_method_names=['GET', 'POST'])
def meals_api_collection(request):
    if request.method == 'GET':
        meals = MealEntry.objects.prefetch_related('items').all()
        serializer = MealEntrySerializer(meals, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MealEntrySerializer(data=_meal_request_data(request), context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def meal_api(request, pk):
    meal = get_object_or_404(
        MealEntry.objects.prefetch_related('items'),
        pk=pk,
    )

    if request.method == 'GET':
        serializer = MealEntrySerializer(meal, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = MealEntrySerializer(
            meal,
            data=_meal_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        meal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(http_method_names=['GET', 'POST'])
def meal_notes_api_collection(request):
    if request.method == 'GET':
        notes = MealNote.objects.all()
        return Response(MealNoteSerializer(notes, many=True).data)

    serializer = MealNoteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    date = serializer.validated_data['date']
    note = MealNote.objects.filter(date=date).order_by('-updated_at', '-pk').first()
    if note:
        note.text = serializer.validated_data.get('text', '')
        note.save(update_fields=['text', 'updated_at'])
    else:
        note = MealNote.objects.create(date=date, text=serializer.validated_data.get('text', ''))
    return Response(MealNoteSerializer(note).data, status=status.HTTP_200_OK)

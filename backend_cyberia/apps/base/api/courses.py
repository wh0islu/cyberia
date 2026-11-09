from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import Course
from apps.base.serializers import CourseSerializer

from .request_data import _course_request_data


@api_view(http_method_names=['GET', 'POST'])
def courses_api_collection(request):
    if request.method == 'GET':
        serializer = CourseSerializer(Course.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CourseSerializer(data=_course_request_data(request), context={'request': request})
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
            data=_course_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

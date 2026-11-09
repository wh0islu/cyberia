from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import Movie, Series
from apps.base.serializers import MovieSerializer, SeriesSerializer

from .request_data import _media_request_data


@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def movies_api_collection(request):
    if request.method == 'GET':
        serializer = MovieSerializer(Movie.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MovieSerializer(data=_media_request_data(request), context={'request': request})
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
            data=_media_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        movie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def series_api_collection(request):
    if request.method == 'GET':
        serializer = SeriesSerializer(Series.objects.all(), many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SeriesSerializer(data=_media_request_data(request), context={'request': request})
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
            data=_media_request_data(request),
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        series.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

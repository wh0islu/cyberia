"""Read-only activity history. Sessions are written by the progress updates
themselves (see apps/base/activity.py), never directly by clients."""

from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import MovieWatchSession, ReadingSession, SeriesWatchSession, StudySession
from apps.base.serializers import (
    MovieWatchSessionSerializer,
    ReadingSessionSerializer,
    SeriesWatchSessionSerializer,
    StudySessionSerializer,
)


@api_view(http_method_names=['GET'])
def reading_sessions_api_collection(request):
    return Response(ReadingSessionSerializer(ReadingSession.objects.all(), many=True).data)


@api_view(http_method_names=['GET'])
def movie_sessions_api_collection(request):
    return Response(MovieWatchSessionSerializer(MovieWatchSession.objects.all(), many=True).data)


@api_view(http_method_names=['GET'])
def series_sessions_api_collection(request):
    return Response(SeriesWatchSessionSerializer(SeriesWatchSession.objects.all(), many=True).data)


@api_view(http_method_names=['GET'])
def study_sessions_api_collection(request):
    return Response(StudySessionSerializer(StudySession.objects.all(), many=True).data)

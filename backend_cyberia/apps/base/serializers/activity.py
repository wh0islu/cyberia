from rest_framework import serializers

from apps.base.models import MovieWatchSession, ReadingSession, SeriesWatchSession, StudySession


class ReadingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingSession
        fields = ['id', 'book', 'date', 'from_page', 'to_page']
        read_only_fields = fields


class MovieWatchSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieWatchSession
        fields = ['id', 'movie', 'date', 'from_minute', 'to_minute']
        read_only_fields = fields


class SeriesWatchSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeriesWatchSession
        fields = ['id', 'series', 'date', 'from_season', 'from_episode', 'to_season', 'to_episode']
        read_only_fields = fields


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = ['id', 'course', 'date', 'from_lesson', 'to_lesson']
        read_only_fields = fields

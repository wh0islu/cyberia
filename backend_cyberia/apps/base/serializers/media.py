from rest_framework import serializers

from apps.base.models import Movie, MovieSource, Series, SeriesSource

from .common import NestedSourcesSerializerMixin


class MovieSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieSource
        fields = ['id', 'format', 'location', 'url']
        read_only_fields = ['id']


class MovieSerializer(NestedSourcesSerializerMixin, serializers.ModelSerializer):
    sources = MovieSourceSerializer(many=True, required=False)
    source_model = MovieSource
    source_parent_field = 'movie'

    class Meta:
        model = Movie
        fields = [
            'id',
            'title',
            'genre',
            'year',
            'director',
            'status',
            'current_minute',
            'language',
            'imdb_id',
            'tmdb_id',
            'tmdb_poster_path',
            'tmdb_synopsis',
            'cover',
            'sources',
        ]
        read_only_fields = ['id']


class SeriesSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeriesSource
        fields = ['id', 'format', 'location', 'url']
        read_only_fields = ['id']


class SeriesSerializer(NestedSourcesSerializerMixin, serializers.ModelSerializer):
    sources = SeriesSourceSerializer(many=True, required=False)
    source_model = SeriesSource
    source_parent_field = 'series'

    class Meta:
        model = Series
        fields = [
            'id',
            'title',
            'genre',
            'original_title',
            'start_year',
            'end_year',
            'number_of_seasons',
            'number_of_episodes',
            'current_season',
            'current_episode',
            'status',
            'imdb_id',
            'tmdb_id',
            'tmdb_poster_path',
            'tmdb_synopsis',
            'cover',
            'sources',
        ]
        read_only_fields = ['id']

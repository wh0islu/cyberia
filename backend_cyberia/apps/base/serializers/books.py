from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.base.models import Book, BookSource

from .common import NestedSourcesSerializerMixin


class BookSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookSource
        fields = ['id', 'format', 'location', 'url']
        read_only_fields = ['id']


class BookSerializer(NestedSourcesSerializerMixin, serializers.ModelSerializer):
    sources = BookSourceSerializer(many=True, required=False)
    source_model = BookSource
    source_parent_field = 'book'

    @transaction.atomic
    def create(self, validated_data):
        if validated_data.get('status') == 'RE' and validated_data.get('current_page', 0) > 0:
            validated_data['last_read_at'] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        status = validated_data.get('status', instance.status)
        page_changed = 'current_page' in validated_data and validated_data['current_page'] != instance.current_page
        started_reading = status == 'RE' and instance.status != 'RE'
        if status == 'RE' and (page_changed or started_reading):
            validated_data['last_read_at'] = timezone.now()
        return super().update(instance, validated_data)

    def validate(self, attrs):
        pages = attrs.get('number_of_pages', getattr(self.instance, 'number_of_pages', None))
        current_page = attrs.get('current_page', getattr(self.instance, 'current_page', 0))
        if pages is not None and current_page > pages:
            raise serializers.ValidationError({
                'current_page': 'The page number cannot exceed the total number of pages.'
            })
        return attrs

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'genre',
            'year',
            'number_of_pages',
            'current_page',
            'started_on',
            'last_read_at',
            'notes',
            'status',
            'language',
            'cover',
            'sources',
        ]
        read_only_fields = ['id', 'last_read_at']


class BooksSerializer(serializers.ModelSerializer):
    sources = BookSourceSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'genre',
            'year',
            'number_of_pages',
            'current_page',
            'started_on',
            'last_read_at',
            'notes',
            'status',
            'language',
            'cover',
            'sources',
        ]
        read_only_fields = ['id', 'last_read_at']

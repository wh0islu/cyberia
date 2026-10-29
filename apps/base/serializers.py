import json

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
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone


# Books
class BookSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookSource
        fields = ['id', 'format', 'location', 'url']
        read_only_fields = ['id']


class NestedSourcesSerializerMixin:
    source_model = None
    source_parent_field = ''

    def _create_sources(self, instance, sources):
        for source in sources:
            self.source_model.objects.create(
                **{self.source_parent_field: instance},
                **source,
            )

    def create(self, validated_data):
        sources = validated_data.pop('sources', [])
        instance = super().create(validated_data)
        self._create_sources(instance, sources)
        return instance

    def update(self, instance, validated_data):
        sources = validated_data.pop('sources', serializers.empty)
        instance = super().update(instance, validated_data)

        if sources is not serializers.empty:
            instance.sources.all().delete()
            self._create_sources(instance, sources)

        return instance


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
        page_changed = (
            'current_page' in validated_data
            and validated_data['current_page'] != instance.current_page
        )
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


# Movies
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
            'id', 'title', 'genre', 'year', 'director', 'status', 'current_minute', 'language',
            'imdb_id', 'tmdb_id', 'tmdb_poster_path', 'tmdb_synopsis', 'cover', 'sources',
        ]
        read_only_fields = ['id']


# Series
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
            'id', 'title', 'genre', 'original_title', 'start_year', 'end_year',
            'number_of_seasons', 'number_of_episodes', 'current_season',
            'current_episode', 'status',
            'imdb_id', 'tmdb_id', 'tmdb_poster_path', 'tmdb_synopsis', 'cover', 'sources',
        ]
        read_only_fields = ['id']


# Meals
class MealItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealItem
        fields = ['id', 'name']
        read_only_fields = ['id']


class MealEntrySerializer(serializers.ModelSerializer):
    items = MealItemSerializer(many=True, required=False)
    tags = serializers.ListField(
        child=serializers.ChoiceField(choices=MealEntry.TAG_OPTIONS),
        required=False,
    )

    class Meta:
        model = MealEntry
        fields = ['id', 'category', 'date', 'time', 'photo', 'tags', 'items', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        items = validated_data.pop('items', [])
        meal = MealEntry.objects.create(**validated_data)
        MealItem.objects.bulk_create([
            MealItem(meal=meal, **item) for item in items
        ])
        return meal

    def update(self, instance, validated_data):
        items = validated_data.pop('items', serializers.empty)
        meal = super().update(instance, validated_data)

        if items is not serializers.empty:
            meal.items.all().delete()
            MealItem.objects.bulk_create([
                MealItem(meal=meal, **item) for item in items
            ])

        return meal


# Courses
class CourseSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSource
        fields = ['id', 'format', 'location', 'url']
        read_only_fields = ['id']


class CourseModulesField(serializers.ListField):
    def to_representation(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = [value] if value else []
        if isinstance(value, str):
            value = [value] if value else []
        if not isinstance(value, list):
            value = []
        return super().to_representation(value)


class CourseSerializer(NestedSourcesSerializerMixin, serializers.ModelSerializer):
    sources = CourseSourceSerializer(many=True, required=False)
    modules = CourseModulesField(
        child=serializers.CharField(max_length=255),
        required=False,
    )
    source_model = CourseSource
    source_parent_field = 'course'

    def validate(self, attrs):
        total_lessons = attrs.get(
            'number_of_lessons',
            getattr(self.instance, 'number_of_lessons', None),
        )
        completed_lessons = attrs.get(
            'completed_lessons',
            getattr(self.instance, 'completed_lessons', 0),
        )
        if total_lessons is not None and completed_lessons > total_lessons:
            raise serializers.ValidationError({
                'completed_lessons': 'Completed lessons cannot exceed the total lessons.'
            })
        return attrs

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'instructor', 'platform', 'number_of_lessons',
            'completed_lessons', 'goal_date', 'modules',
            'status', 'language', 'url', 'cover', 'certificate_available',
            'certificate_obtained', 'sources',
        ]
        read_only_fields = ['id']


# Routine
class HabitCompletionSerializer(serializers.ModelSerializer):
    habit = serializers.PrimaryKeyRelatedField(queryset=Habit.objects.all())

    class Meta:
        model = HabitCompletion
        fields = ['id', 'habit', 'date', 'completed']
        read_only_fields = ['id']

    def validate_habit(self, habit):
        request = self.context.get('request')
        if request and habit.user_id != request.user.id:
            raise serializers.ValidationError('This habit does not belong to the current user.')
        return habit

    def validate(self, attrs):
        habit = attrs.get('habit', self.instance.habit if self.instance else None)
        date = attrs.get('date', self.instance.date if self.instance else None)
        existing = HabitCompletion.objects.filter(habit=habit, date=date)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if habit and date and existing.exists():
            raise serializers.ValidationError(
                'A completion for this habit already exists on this date.'
            )
        return attrs


class HabitSerializer(serializers.ModelSerializer):
    weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        allow_empty=False,
    )
    completions = HabitCompletionSerializer(many=True, read_only=True)

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'weekdays', 'time', 'goal', 'linked_section',
            'reminder', 'completions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_weekdays(self, weekdays):
        if len(weekdays) != len(set(weekdays)):
            raise serializers.ValidationError('Weekdays must not be repeated.')
        return weekdays

    def create(self, validated_data):
        request = self.context['request']
        user = validated_data.pop('user', request.user)
        return Habit.objects.create(user=user, **validated_data)

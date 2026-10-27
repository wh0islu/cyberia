from rest_framework import serializers

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


# Books
class BooksSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'year']


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
            'notes',
            'status',
            'language',
            'cover',
            'sources',
        ]
        read_only_fields = ['id']


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
            'id', 'title', 'year', 'director', 'status', 'language',
            'imdb_id', 'tmdb_id', 'cover', 'sources',
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
            'id', 'title', 'original_title', 'start_year', 'end_year',
            'number_of_seasons', 'number_of_episodes', 'status',
            'imdb_id', 'tmdb_id', 'cover', 'sources',
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


class CourseSerializer(NestedSourcesSerializerMixin, serializers.ModelSerializer):
    sources = CourseSourceSerializer(many=True, required=False)
    source_model = CourseSource
    source_parent_field = 'course'

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'instructor', 'platform', 'number_of_lessons',
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

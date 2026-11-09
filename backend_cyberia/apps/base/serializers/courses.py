import json

from rest_framework import serializers

from apps.base.models import Course, CourseSource

from .common import NestedSourcesSerializerMixin


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
            'id',
            'title',
            'instructor',
            'platform',
            'number_of_lessons',
            'completed_lessons',
            'goal_date',
            'modules',
            'status',
            'language',
            'url',
            'cover',
            'certificate_available',
            'certificate_obtained',
            'sources',
        ]
        read_only_fields = ['id']

from rest_framework import serializers

from apps.base.models import Habit, HabitCompletion


class HabitCompletionSerializer(serializers.ModelSerializer):
    habit = serializers.PrimaryKeyRelatedField(queryset=Habit.objects.all())

    class Meta:
        model = HabitCompletion
        fields = ['id', 'habit', 'date', 'completed']
        read_only_fields = ['id']

    def validate(self, attrs):
        habit = attrs.get('habit', self.instance.habit if self.instance else None)
        date = attrs.get('date', self.instance.date if self.instance else None)
        existing = HabitCompletion.objects.filter(habit=habit, date=date)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if habit and date and existing.exists():
            raise serializers.ValidationError('A completion for this habit already exists on this date.')
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
            'id',
            'name',
            'weekdays',
            'time',
            'goal',
            'linked_section',
            'reminder',
            'completions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @staticmethod
    def validate_weekdays(weekdays):
        if len(weekdays) != len(set(weekdays)):
            raise serializers.ValidationError('Weekdays must not be repeated.')
        return weekdays

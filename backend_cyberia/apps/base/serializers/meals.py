from typing import override

from rest_framework import serializers

from apps.base.models import MealEntry, MealItem, MealNote


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

    @override
    def create(self, validated_data):
        items = validated_data.pop('items', [])
        meal = MealEntry.objects.create(**validated_data)
        MealItem.objects.bulk_create([MealItem(meal=meal, **item) for item in items])
        return meal

    def update(self, instance, validated_data):
        items = validated_data.pop('items', serializers.empty)
        meal = super().update(instance, validated_data)

        if items is not serializers.empty:
            meal.items.all().delete()
            MealItem.objects.bulk_create([MealItem(meal=meal, **item) for item in items])

        return meal


class MealNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealNote
        fields = ['id', 'date', 'text', 'updated_at']
        read_only_fields = ['id', 'updated_at']
        extra_kwargs = {'date': {'validators': []}}

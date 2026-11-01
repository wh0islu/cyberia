from rest_framework import serializers


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

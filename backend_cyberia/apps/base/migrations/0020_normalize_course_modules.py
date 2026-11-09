import json

from django.db import migrations


def normalize_course_modules(apps, schema_editor):
    Course = apps.get_model('base', 'Course')

    for course in Course.objects.all().iterator():
        value = course.modules
        if isinstance(value, list):
            continue

        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                pass

        if isinstance(value, list):
            modules = [item for item in value if isinstance(item, str)]
        elif isinstance(value, str) and value:
            modules = [value]
        else:
            modules = []

        Course.objects.filter(pk=course.pk).update(modules=modules)


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0019_course_progress_details_and_instructor_length'),
    ]

    operations = [
        migrations.RunPython(normalize_course_modules, migrations.RunPython.noop),
    ]

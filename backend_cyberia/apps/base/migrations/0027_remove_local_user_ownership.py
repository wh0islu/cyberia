from django.db import migrations, models
from django.db.models import Count


def remove_duplicate_notes(apps, schema_editor):
    meal_note = apps.get_model('base', 'MealNote')
    duplicate_dates = (
        meal_note.objects.values('date')
        .annotate(total=Count('id'))
        .filter(total__gt=1)
        .values_list('date', flat=True)
    )
    for date in duplicate_dates:
        notes = meal_note.objects.filter(date=date).order_by('-updated_at', '-pk')
        notes.exclude(pk=notes.first().pk).delete()


def remove_local_account(apps, schema_editor):
    user = apps.get_model('auth', 'User')
    user.objects.filter(username='cyberia-local').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0026_add_meal_notes'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='mealnote',
            name='unique_meal_note_per_user_and_day',
        ),
        migrations.RemoveField(
            model_name='habit',
            name='user',
        ),
        migrations.RemoveField(
            model_name='mealentry',
            name='user',
        ),
        migrations.RunPython(remove_duplicate_notes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='mealnote',
            name='date',
            field=models.DateField(unique=True),
        ),
        migrations.RemoveField(
            model_name='mealnote',
            name='user',
        ),
        migrations.RunPython(remove_local_account, migrations.RunPython.noop),
    ]

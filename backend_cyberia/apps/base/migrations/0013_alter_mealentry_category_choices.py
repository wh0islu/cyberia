from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0012_habit_habitcompletion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mealentry',
            name='category',
            field=models.CharField(
                choices=[
                    ('BR', 'Breakfast'),
                    ('LU', 'Lunch'),
                    ('SN', 'Snack'),
                    ('DI', 'Dinner'),
                    ('OT', 'Other'),
                ],
                max_length=2,
            ),
        ),
    ]

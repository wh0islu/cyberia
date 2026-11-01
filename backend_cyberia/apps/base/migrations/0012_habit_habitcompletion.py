import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0011_merge_20261027_0238'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Habit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('weekdays', models.JSONField(default=list)),
                ('time', models.TimeField(blank=True, null=True)),
                ('goal', models.CharField(blank=True, max_length=255)),
                ('linked_section', models.CharField(blank=True, choices=[('books', 'Books'), ('courses', 'Courses'), ('meals', 'Meals')], max_length=10, null=True)),
                ('reminder', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='habits', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='HabitCompletion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('completed', models.BooleanField(default=True)),
                ('habit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='completions', to='base.habit')),
            ],
        ),
        migrations.AddConstraint(
            model_name='habitcompletion',
            constraint=models.UniqueConstraint(fields=('habit', 'date'), name='unique_habit_completion_per_day'),
        ),
    ]

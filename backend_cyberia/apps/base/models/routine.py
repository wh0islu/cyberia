from django.db import models


class Habit(models.Model):
    LINKED_SECTION_OPTIONS = [
        ('books', 'Books'),
        ('courses', 'Courses'),
        ('meals', 'Meals'),
    ]

    name = models.CharField(max_length=150)
    weekdays = models.JSONField(default=list)
    time = models.TimeField(blank=True, null=True)
    goal = models.CharField(max_length=255, blank=True)
    linked_section = models.CharField(
        max_length=10,
        choices=LINKED_SECTION_OPTIONS,
        blank=True,
        null=True,
    )
    reminder = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HabitCompletion(models.Model):
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    date = models.DateField()
    completed = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['habit', 'date'],
                name='unique_habit_completion_per_day',
            ),
        ]

    def __str__(self):
        return f'{self.habit.name} - {self.date}'

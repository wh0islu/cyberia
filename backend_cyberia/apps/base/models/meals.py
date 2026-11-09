from django.db import models
from django.utils import timezone


class MealEntry(models.Model):
    MEAL_OPTIONS = [
        ('BR', 'Breakfast'),
        ('LU', 'Lunch'),
        ('SN', 'Snack'),
        ('DI', 'Dinner'),
        ('OT', 'Other'),
    ]
    TAG_OPTIONS = [
        ('home', 'Homemade'),
        ('out', 'Eating out'),
        ('delivery', 'Delivery'),
        ('quick', 'Quick'),
        ('healthy', 'Healthy'),
    ]

    category = models.CharField(max_length=2, choices=MEAL_OPTIONS)
    date = models.DateField(default=timezone.localdate)
    time = models.TimeField(blank=True, null=True)
    photo = models.ImageField(upload_to='meals/photos/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.get_category_display()} - {self.date}'


class MealItem(models.Model):
    meal = models.ForeignKey(MealEntry, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name


class MealNote(models.Model):
    date = models.DateField(unique=True)
    text = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return str(self.date)

import django.utils.timezone
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('base', '0008_book_genre_started_on_notes'),
    ]

    operations = [
        migrations.CreateModel(
            name='MealEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('BR', 'Café'), ('LU', 'Almoço'), ('SN', 'Lanche'), ('DI', 'Jantar'), ('OT', 'Outro')], max_length=2)),
                ('date', models.DateField(default=django.utils.timezone.localdate)),
                ('time', models.TimeField(blank=True, null=True)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='meals/photos/')),
                ('tags', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meal_entries', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='MealItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('meal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='base.mealentry')),
            ],
        ),
    ]

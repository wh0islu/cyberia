from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0021_merge_reviewing_books_into_reading'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='last_read_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

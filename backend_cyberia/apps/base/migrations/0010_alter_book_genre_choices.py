from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0008_book_genre_started_on_notes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='genre',
            field=models.CharField(
                blank=True,
                choices=[
                    ('FI', 'Fiction'),
                    ('TC', 'Technical'),
                    ('FA', 'Fantasy'),
                    ('SF', 'Science fiction'),
                    ('HI', 'Historical'),
                    ('BI', 'Biography'),
                    ('NF', 'Non-fiction'),
                    ('OT', 'Other'),
                ],
                max_length=2,
            ),
        ),
    ]

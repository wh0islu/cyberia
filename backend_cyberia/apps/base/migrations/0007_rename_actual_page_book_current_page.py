from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0006_book_actual_page'),
    ]

    operations = [
        migrations.RenameField(
            model_name='book',
            old_name='actual_page',
            new_name='current_page',
        ),
    ]

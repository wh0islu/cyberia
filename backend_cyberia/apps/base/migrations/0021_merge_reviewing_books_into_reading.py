from django.db import migrations, models


def merge_reviewing_books(apps, schema_editor):
    Book = apps.get_model('base', 'Book')
    Book.objects.using(schema_editor.connection.alias).filter(status='RW').update(status='RE')


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0020_normalize_course_modules'),
    ]

    operations = [
        migrations.RunPython(merge_reviewing_books, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='book',
            name='status',
            field=models.CharField(
                max_length=2,
                choices=[('RE', 'READING'), ('NR', 'NOT READING'), ('FD', 'FINISHED')],
                default='NR',
            ),
        ),
    ]

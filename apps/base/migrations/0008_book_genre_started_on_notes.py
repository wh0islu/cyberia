from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_rename_actual_page_book_current_page'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='genre',
            field=models.CharField(blank=True, choices=[('FI', 'Fiction'), ('RO', 'Romance'), ('FA', 'Fantasy'), ('SF', 'Science fiction'), ('HI', 'Historical'), ('BI', 'Biography'), ('NF', 'Non-fiction'), ('OT', 'Other')], max_length=2),
        ),
        migrations.AddField(
            model_name='book',
            name='started_on',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='book',
            name='notes',
            field=models.TextField(blank=True),
        ),
    ]

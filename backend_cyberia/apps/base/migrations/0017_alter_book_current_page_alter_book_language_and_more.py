from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0016_movie_progress_and_series_progress'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='current_page',
            field=models.PositiveIntegerField(default=0, help_text='Current page being read'),
        ),
        migrations.AlterField(
            model_name='book',
            name='language',
            field=models.CharField(blank=True, choices=[('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')], default='', max_length=5),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='book',
            name='status',
            field=models.CharField(choices=[('RE', 'READING'), ('NR', 'NOT READING'), ('FD', 'FINISHED'), ('RW', 'REVIEWING')], default='NR', max_length=2),
        ),
    ]

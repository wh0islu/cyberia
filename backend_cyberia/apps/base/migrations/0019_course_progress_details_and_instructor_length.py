from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0018_alter_book_author'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='instructor',
            field=models.CharField(
                blank=True,
                help_text='Course instructors',
                max_length=500,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='course',
            name='completed_lessons',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='course',
            name='goal_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='course',
            name='modules',
            field=models.JSONField(blank=True, default=list),
        ),
    ]

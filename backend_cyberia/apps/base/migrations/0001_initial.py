import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text="Book's title", max_length=100)),
                ('author', models.CharField(help_text="Author's name", max_length=100)),
                ('year', models.IntegerField(blank=True, help_text='Year of the book', null=True)),
                ('number_of_pages', models.IntegerField(blank=True, help_text='Number of pages', null=True)),
                ('book_status', models.CharField(choices=[('RE', 'READING'), ('NR', 'NOT READING'), ('FD', 'FINISHED'), ('RW', 'REVIEWING')], default='NR', null=True)),
                ('language', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='BookSource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('format', models.CharField(choices=[('PH', 'PHYSICAL'), ('PDF', 'PDF'), ('EPUB', 'EPUB'), ('WEB', 'ONLINE')], max_length=4, null=True)),
                ('location', models.CharField(blank=True, max_length=255, null=True)),
                ('url', models.URLField(blank=True, null=True)),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='base.book')),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Mr Penguim', max_length=60)),
                ('bio', models.TextField(null=True)),
                ('nationality', models.CharField(help_text='Siberian', max_length=10)),
                ('goals', models.CharField(blank=True, help_text='Help people.', max_length=100)),
                ('message', models.TextField(help_text='Be humble.', null=True)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='perfil/')),
                ('user', models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SeedWord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('index', models.PositiveIntegerField()),
                ('word_hash', models.CharField(max_length=128)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='base.profile')),
            ],
            options={
                'unique_together': {('profile', 'index')},
            },
        ),
    ]

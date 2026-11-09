from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('base', '0024_alter_profile_name'),
    ]

    operations = [
        migrations.DeleteModel(name='SeedWord'),
        migrations.DeleteModel(name='Profile'),
    ]

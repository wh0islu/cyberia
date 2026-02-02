from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=60, help_text="Mr Penguim")
    bio = models.TextField(null=True)
    nationality = models.CharField(max_length=10, help_text="Siberian")
    goals = models.CharField(max_length=100, help_text="Help people.", blank=True)
    message = models.TextField(null=True, help_text="Be humble.")
    photo = models.ImageField(upload_to='perfil/', blank=True, null=True)

    def __str__(self):
        return f"{self.name}'s profile"


class SeedWord(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    index = models.PositiveIntegerField()  # posição da palavra (1, 2, 3…)
    word_hash = models.CharField(max_length=128)

    class Meta:
        unique_together = ("profile", "index")

    def __str__(self):
        return f"{self.profile.name} - word {self.index}"

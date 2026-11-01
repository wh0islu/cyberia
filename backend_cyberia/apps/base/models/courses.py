from django.db import models


class Course(models.Model):
    COURSE_OPTIONS = [
        ('NS', 'NOT STARTED'),
        ('IP', 'IN PROGRESS'),
        ('CD', 'COMPLETED'),
        ('PA', 'PAUSED'),
        ('RY', 'REVIEWING'),
    ]
    LANGUAGE_OPTIONS = [('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')]

    title = models.CharField(max_length=255, help_text='Python 3.15 programming course')
    instructor = models.CharField(max_length=500, blank=True, null=True, help_text='Course instructors')
    platform = models.CharField(max_length=100, blank=True, null=True)
    number_of_lessons = models.PositiveIntegerField(blank=True, null=True)
    completed_lessons = models.PositiveIntegerField(default=0)
    goal_date = models.DateField(blank=True, null=True)
    modules = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=2, default='NS', choices=COURSE_OPTIONS)
    language = models.CharField(max_length=2, blank=True, null=True, choices=LANGUAGE_OPTIONS)
    url = models.URLField(blank=True, null=True)
    cover = models.ImageField(upload_to='courses/covers/', blank=True, null=True)
    certificate_available = models.BooleanField(default=False)
    certificate_obtained = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.title} - {self.platform}'


class CourseSource(models.Model):
    FORMAT_OPTIONS = [('WEB', 'ONLINE'), ('VID', 'VIDEO'), ('LOC', 'LOCAL FILES')]
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sources')
    format = models.CharField(max_length=3, choices=FORMAT_OPTIONS)
    location = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.course.title} - {self.course.platform}'

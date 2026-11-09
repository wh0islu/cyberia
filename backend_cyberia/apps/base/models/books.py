from django.db import models


class Book(models.Model):
    BOOK_OPTIONS = [
        ('RE', 'READING'),
        ('NR', 'NOT READING'),
        ('FD', 'FINISHED'),
    ]

    LANGUAGE_OPTIONS = [('PT', 'PORTUGUESE'), ('EN', 'ENGLISH')]
    GENRE_OPTIONS = [
        ('FI', 'Fiction'),
        ('TC', 'Technical'),
        ('FA', 'Fantasy'),
        ('SF', 'Science fiction'),
        ('HI', 'Historical'),
        ('BI', 'Biography'),
        ('NF', 'Non-fiction'),
        ('OT', 'Other'),
    ]

    title = models.CharField(max_length=100, help_text="Book's title")
    author = models.CharField(max_length=500, help_text='Book authors')
    genre = models.CharField(max_length=2, choices=GENRE_OPTIONS, blank=True)
    year = models.IntegerField(blank=True, null=True, help_text='Year of the book')
    number_of_pages = models.PositiveIntegerField(blank=True, null=True, help_text='Number of pages')
    current_page = models.PositiveIntegerField(default=0, help_text='Current page being read')
    started_on = models.DateField(blank=True, null=True)
    last_read_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=2, choices=BOOK_OPTIONS, default='NR')
    language = models.CharField(max_length=5, choices=LANGUAGE_OPTIONS, blank=True)
    cover = models.ImageField(upload_to='books/covers/', blank=True, null=True)

    def __str__(self):
        return f'{self.title} - {self.author}'


class BookSource(models.Model):
    FORMAT_OPTIONS = [
        ('PH', 'PHYSICAL'),
        ('PDF', 'PDF'),
        ('EPUB', 'EPUB'),
        ('WEB', 'ONLINE'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='sources')
    format = models.CharField(max_length=4, null=True, choices=FORMAT_OPTIONS)
    location = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f'{self.book.title} - {self.book.author} - {self.format}'

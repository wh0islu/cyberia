from django.contrib import admin

from .models import Book, BookSource, Course, CourseSource, Movie, MovieSource, Profile, SeedWord, Series, SeriesSource, MealEntry, MealItem

admin.site.register(Profile)
admin.site.register(Book)
admin.site.register(BookSource)
admin.site.register(Course)
admin.site.register(CourseSource)
admin.site.register(Movie)
admin.site.register(MovieSource)
admin.site.register(Series)
admin.site.register(SeriesSource)
admin.site.register(MealEntry)
admin.site.register(MealItem)

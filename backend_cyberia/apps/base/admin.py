from django.contrib import admin

from .models import (
    Book,
    BookSource,
    Course,
    CourseSource,
    MealEntry,
    MealItem,
    MealNote,
    Movie,
    MovieSource,
    Series,
    SeriesSource,
)

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
admin.site.register(MealNote)

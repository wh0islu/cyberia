from apps.base.models import Book
from rest_framework import serializers


class BooksSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'year']


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'year', 'number_of_pages', 'status', 'language', ]

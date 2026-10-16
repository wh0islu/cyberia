from apps.base.models import Book
from apps.base.serializers import BookSerializer, BooksSerializer
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(http_method_names=['GET'])
def books_api_list(request):
    books = Book.objects.all()
    serializer = BooksSerializer(instance=books, many=True)
    return Response(serializer.data)


@api_view(http_method_names=['GET'])
def book_api(request, pk):
    book = get_object_or_404(Book.objects.all(), pk=pk)
    serializer = BookSerializer(instance=book, many=False, context={'request': request})
    return Response(serializer.data)

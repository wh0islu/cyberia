from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.base.models import Book
from apps.base.serializers import BookSerializer, BooksSerializer


@ensure_csrf_cookie
@api_view(http_method_names=['GET', 'POST'])
def books_api_collection(request):
    if request.method == 'GET':
        books = Book.objects.prefetch_related('sources').all()
        serializer = BooksSerializer(instance=books, many=True, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BookSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(http_method_names=['GET', 'PATCH', 'DELETE'])
def book_api(request, pk):
    book = get_object_or_404(Book.objects.all(), pk=pk)

    if request.method == 'GET':
        serializer = BookSerializer(instance=book, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = BookSerializer(
            instance=book,
            data=request.data,
            context={'request': request},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

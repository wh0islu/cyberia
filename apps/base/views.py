import random

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import (
    BookForm,
    BookProgressForm,
    BookSourceFormSet,
    MealEntryForm,
    MealItemFormSet,
    Signup,
)
from .models import Book, MealEntry, Profile, SeedWord
from .spotify import get_now_playing, get_recently_played
from .utils import generate_seed


@login_required(login_url='base:loginUser')
def home(request):
    book = Book.objects.filter(status='RE').first()
    current_page = book.current_page if book else 0
    number_of_pages = book.number_of_pages if book else None
    progress = 0

    if number_of_pages is not None and number_of_pages > 0:
        progress = min(round(current_page / number_of_pages * 100, 2), 100)

    meals_today = MealEntry.objects.filter(
        user=request.user,
        date=timezone.localdate(),
    ).prefetch_related('items')

    return render(request, 'base/home.html', {
        'book': book,
        'current_page': current_page,
        'number_of_pages': number_of_pages,
        'progress': progress,
        'meals_today': meals_today,
    })


@login_required(login_url='base:loginUser')
def create_meal(request):
    if request.method == 'POST':
        form = MealEntryForm(request.POST, request.FILES)
        item_formset = MealItemFormSet(request.POST, prefix='items')
        form_is_valid = form.is_valid()
        items_are_valid = item_formset.is_valid()

        if form_is_valid and items_are_valid:
            with transaction.atomic():
                meal = form.save(commit=False)
                meal.user = request.user
                meal.save()
                form.save_m2m()
                item_formset.instance = meal
                item_formset.save()

            return redirect('base:home')
    else:
        form = MealEntryForm(initial={'date': timezone.localdate()})
        item_formset = MealItemFormSet(prefix='items')

    return render(request, 'base/meal_form.html', {
        'form': form,
        'item_formset': item_formset,
    })


@login_required(login_url='base:loginUser')
def addBook(request):
    if request.method == 'POST':
        form = BookForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('base:books')
    else:
        form = BookForm()
    books = Book.objects.all()

    return render(request, 'base/books.html', {'books': books, 'form': form})


@login_required(login_url='base:loginUser')
def update_book_page(request, book_id):
    book = get_object_or_404(Book, id=book_id)

    if request.method == 'POST':
        form = BookProgressForm(request.POST)

        if form.is_valid():
            page = form.cleaned_data['current_page']

            if book.number_of_pages and page > book.number_of_pages:
                form.add_error(
                    'current_page',
                    'The page number cannot exceed the total number of pages.'
                )
            else:
                book.current_page = page
                book.save(update_fields=['current_page'])
                return redirect('base:home')

    return redirect('base:home')

@login_required(login_url='base:loginUser')
def books(request):
    if request.method == 'POST':
        book_form = BookForm(request.POST, request.FILES)
        source_formset = BookSourceFormSet(request.POST, prefix='sources')

        if book_form.is_valid() and source_formset.is_valid():
            with transaction.atomic():
                book = book_form.save()
                source_formset.instance = book
                source_formset.save()

            return redirect('base:books')
    else:
        book_form = BookForm()
        source_formset = BookSourceFormSet(prefix='sources')

    books = Book.objects.all()
    context = {
        'books': books,
        'book_form': book_form,
        'source_formset': source_formset,
    }
    return render(request, 'base/books.html', context)


@login_required(login_url='base:loginUser')
def now_playing(request):
    return JsonResponse(get_now_playing())


@login_required(login_url='base:loginUser')
def recently_played(request):
    return JsonResponse({'items': get_recently_played()})


@login_required(login_url='base:loginUser')
def profile(request):
    profile = Profile.objects.get(user=request.user)
    context = {'profile': profile}
    return render(request, 'base/profile.html', context)


def loginUser(request):
    page = 'loginUser'
    if request.user.is_authenticated:
        return redirect('base:home')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            pass
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('base:home')
        else:
            messages.error(request, 'Username OR password does not exist!')

    context = {'page': page}
    return render(request, 'base/login.html', context)


def logoutUser(request):
    logout(request)
    return redirect('base:home')


def showSeed(request):
    seed = request.session.get('seed_phrase')

    if not seed:
        return redirect('base:loginUser')

    del request.session['seed_phrase']

    return render(request, 'base/show_seed.html', {'seed': seed})


def registerUser(request):
    form = Signup()
    seed_file_ready = False

    if request.method == 'POST':
        form = Signup(request.POST)

        if form.is_valid():
            user = form.save(commit=False)
            user.username = user.username.lower()
            user.save()

            profile = Profile.objects.create(user=user)

            seed_words = generate_seed()

            SeedWord.objects.bulk_create([
                SeedWord(profile=profile, index=i, word_hash=make_password(word))
                for i, word in enumerate(seed_words, start=1)
            ])

            # 🔐 Create the file contents.
            seed_text = '\n'.join(f'{i}. {word}' for i, word in enumerate(seed_words, start=1))

            # Store the data in the session temporarily.
            request.session['seed_file'] = seed_text

            seed_file_ready = True

    return render(
        request,
        'base/register.html',
        {
            'form': form,
            'seed_file_ready': seed_file_ready,
        },
    )


def download_seed(request):
    seed_text = request.session.get('seed_file')

    if not seed_text:
        return HttpResponse(status=404)

    response = HttpResponse(seed_text, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="seedphrases.txt"'

    # remove depois do download
    del request.session['seed_file']

    return response


def recover_account(request):
    if request.method == 'GET':
        positions = sorted(random.sample(range(1, 10), 5))
        request.session['seed_positions'] = positions
        return render(request, 'base/recovery.html', {'positions': positions})

    if request.method == 'POST':
        username = request.POST.get('username')
        new_password = request.POST.get('password')

        try:
            user = User.objects.get(username=username)
            profile = Profile.objects.get(user=user)
        except (User.DoesNotExist, Profile.DoesNotExist):
            messages.error(request, 'Invalid credentials')
            return redirect('base:recovery')

        positions = request.session.get('seed_positions', [])

        for pos in positions:
            user_word = request.POST.get(f'word_{pos}')

            try:
                seed_word = SeedWord.objects.get(profile=profile, index=pos)
            except SeedWord.DoesNotExist:
                messages.error(request, 'Invalid credentials')
                return redirect('base:recovery')

            if not check_password(user_word, seed_word.word_hash):
                messages.error(request, 'Invalid credentials')
                return redirect('base:recovery')

        # Valid password → reset the credentials.
        user.set_password(new_password)
        user.save()

        # apagar seed antiga
        SeedWord.objects.filter(profile=profile).delete()

        new_seed = generate_seed()

        seed_objects = []
        for i, word in enumerate(new_seed, start=1):
            seed_objects.append(SeedWord(profile=profile, index=i, word_hash=make_password(word)))

        SeedWord.objects.bulk_create(seed_objects)

        request.session['seed_phrase'] = new_seed
        return redirect('base:show-seed')
    return render(
        request,
        'base/pages/recovery.html',
    )

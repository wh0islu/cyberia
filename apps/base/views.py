import random

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import redirect, render

from .forms import Signup
from .models import Book, Profile, SeedWord
from .utils import generate_seed


@login_required(login_url='loginUser')
def home(request):
    books = Book.objects.all()
    context = {'books': books}
    return render(request, 'base/home.html', context)


@login_required(login_url='loginUser')
def profile(request):
    profile = Profile.objects.get(user=request.user)
    context = {'profile': profile}
    return render(request, 'base/profile.html', context)


def loginUser(request):
    page = 'loginUser'
    if request.user.is_authenticated:
        return redirect('home')

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
            return redirect('home')
        else:
            messages.error(request, 'Username OR password does not exist!')

    context = {'page': page}
    return render(request, 'base/login.html', context)


def logoutUser(request):
    logout(request)
    return redirect('home')


def showSeed(request):
    seed = request.session.get('seed_phrase')

    if not seed:
        return redirect('loginUser')

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

            # 🔐 cria conteúdo do arquivo
            seed_text = '\n'.join(f'{i}. {word}' for i, word in enumerate(seed_words, start=1))

            # guarda temporariamente na sessão (curto prazo)
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


def recoverAccount(request):
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
        except User.DoesNotExist, Profile.DoesNotExist:
            messages.error(request, 'Invalid credentials')
            return redirect('recovery')

        positions = request.session.get('seed_positions', [])

        for pos in positions:
            user_word = request.POST.get(f'word_{pos}')

            try:
                seed_word = SeedWord.objects.get(profile=profile, index=pos)
            except SeedWord.DoesNotExist:
                messages.error(request, 'Invalid credentials')
                return redirect('recovery')

            if not check_password(user_word, seed_word.word_hash):
                messages.error(request, 'Invalid credentials')
                return redirect('recovery')

        # senha válida → redefinir
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
        return redirect('show-seed')

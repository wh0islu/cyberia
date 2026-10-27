import urllib.parse

from apps.base.spotify import exchange_code
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

REDIRECT_URI = 'http://127.0.0.1:1337/callback'
SCOPES = 'user-read-currently-playing user-read-playback-state user-read-recently-played'


class Command(BaseCommand):
    help = 'Gera o SPOTIFY_REFRESH_TOKEN (executar uma unica vez).'

    def handle(self, *args, **options):
        if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
            raise CommandError('Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env primeiro.')

        query = urllib.parse.urlencode({
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'scope': SCOPES,
        })
        self.stdout.write(f'1. Abra no navegador e autorize:\nhttps://accounts.spotify.com/authorize?{query}\n')
        self.stdout.write('2. You will be redirected to a page that does not load. Copy its full URL.')
        redirected = input('URL: ').strip()

        code = urllib.parse.parse_qs(urllib.parse.urlparse(redirected).query).get('code', [None])[0]
        if not code:
            raise CommandError('Nao encontrei o parametro "code" nessa URL.')

        tokens = exchange_code(code, REDIRECT_URI)
        self.stdout.write(self.style.SUCCESS('\nAdicione ao .env:'))
        self.stdout.write(f'SPOTIFY_REFRESH_TOKEN={tokens["refresh_token"]}')

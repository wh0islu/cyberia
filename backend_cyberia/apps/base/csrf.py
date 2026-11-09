from typing import override

from django.middleware.csrf import get_token
from rest_framework.authentication import BaseAuthentication, SessionAuthentication


class CsrfAuthentication(BaseAuthentication):
    @override
    def authenticate(self, request):
        get_token(request)
        if request.method not in {'GET', 'HEAD', 'OPTIONS'}:
            SessionAuthentication().enforce_csrf(request)

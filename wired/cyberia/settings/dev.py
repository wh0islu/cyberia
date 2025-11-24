# cyberia/settings/dev.py

from .base import *

# ATENÇÃO: A biblioteca python-decouple irá procurar e carregar automaticamente
# as variáveis de um arquivo .env na raiz do seu projeto.
# Você não precisa mais do 'load_dotenv' aqui.

# # Adiciona apps específicos para desenvolvimento
# INSTALLED_APPS += [
#     'django_browser_reload',
# ]

# # Adiciona middlewares específicos para desenvolvimento
# MIDDLEWARE += [
#     "django_browser_reload.middleware.BrowserReloadMiddleware",
# ]

# Em desenvolvimento, qualquer host é permitido para facilitar
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


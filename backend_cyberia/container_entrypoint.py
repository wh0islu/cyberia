import os
import subprocess
import sys

MIN_SECRET_KEY_LENGTH = 50
MIN_SECRET_KEY_UNIQUE_CHARACTERS = 5


def main():
    secret_key = os.environ.get('SECRET_KEY', '')
    if (
        len(secret_key) < MIN_SECRET_KEY_LENGTH
        or len(set(secret_key)) < MIN_SECRET_KEY_UNIQUE_CHARACTERS
        or secret_key.startswith(('replace-with-', 'django-insecure-'))
    ):
        raise SystemExit(
            'Set a random SECRET_KEY with at least 50 characters in '
            'backend_cyberia/.env before starting Docker.'
        )

    command = sys.argv[1:]
    if not command:
        raise SystemExit('A container command is required.')

    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], check=True)
    os.execvp(command[0], command)


if __name__ == '__main__':
    main()

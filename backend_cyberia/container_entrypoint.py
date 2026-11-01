import os
import subprocess
import sys


def main():
    secret_key = os.environ.get('SECRET_KEY', '')
    if not secret_key or secret_key.startswith('replace-with-'):
        raise SystemExit('Set your own SECRET_KEY in backend_cyberia/.env before starting Docker.')

    command = sys.argv[1:]
    if not command:
        raise SystemExit('A container command is required.')

    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], check=True)
    os.execvp(command[0], command)


if __name__ == '__main__':
    main()

import os
import subprocess
import sys
from unittest.mock import Mock, call, patch

from container_entrypoint import main
from django.test import SimpleTestCase


class ContainerStartupTests(SimpleTestCase):
    secret_key = 'test-container-secret-with-at-least-50-characters-1234567890!'

    @staticmethod
    def test_migrates_before_starting_the_command():
        command = ['gunicorn', 'cyberia.wsgi:application', '--bind', '0.0.0.0:8000']
        with (
            patch.dict(os.environ, {'SECRET_KEY': ContainerStartupTests.secret_key}),
            patch.object(sys, 'argv', ['container_entrypoint.py', *command]),
            patch('container_entrypoint.subprocess.run') as migrate,
            patch('container_entrypoint.os.execvp') as execute,
        ):
            actions = Mock()
            actions.attach_mock(migrate, 'migrate')
            actions.attach_mock(execute, 'execute')
            main()
            assert actions.mock_calls == [
                call.migrate([sys.executable, 'manage.py', 'migrate', '--noinput'], check=True),
                call.execute(command[0], command),
            ]

    def test_unsafe_secret_prevents_startup(self):
        for secret in ['', 'short-secret', 'a' * 60, 'replace-with-your-own-random-secret-key']:
            with (
                self.subTest(secret=secret),
                patch.dict(os.environ, {'SECRET_KEY': secret}),
                patch('container_entrypoint.subprocess.run') as migrate,
                patch('container_entrypoint.os.execvp') as execute,
            ):
                caught = None
                try:
                    main()
                except SystemExit as error:
                    caught = error
                assert caught is not None
                assert 'SECRET_KEY' in str(caught)
                migrate.assert_not_called()
                execute.assert_not_called()

    @staticmethod
    def test_failed_migration_prevents_server_startup():
        failure = subprocess.CalledProcessError(1, ['manage.py', 'migrate'])
        with (
            patch.dict(os.environ, {'SECRET_KEY': ContainerStartupTests.secret_key}),
            patch.object(sys, 'argv', ['container_entrypoint.py', 'python', 'manage.py', 'runserver']),
            patch('container_entrypoint.subprocess.run', side_effect=failure),
            patch('container_entrypoint.os.execvp') as execute,
        ):
            caught = None
            try:
                main()
            except subprocess.CalledProcessError as error:
                caught = error
            assert caught is failure
            execute.assert_not_called()

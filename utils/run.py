import shutil
import subprocess
import sys
from pathlib import Path

# =========================================================
# Utils
# =========================================================


def run(cmd, shell=False):
    subprocess.run(cmd, shell=shell, check=True)


def python_cmd():
    return "python" if sys.platform.startswith("win") else "python3"


# =========================================================
# Environment
# =========================================================

def setup_poetry():
    run(["poetry", "init", "-n"])
    run(["poetry", "add", "django", "djangorestframework", "python-decouple",
         "pillow"])
    return "poetry run python"


# =========================================================
# Django project
# =========================================================

def create_project(python, project_name):
    run(f"{python} -m django startproject {project_name} .", shell=True)


def split_settings(project_name):
    base = Path(project_name)
    settings_py = base / "settings.py"
    settings_dir = base / "settings"

    settings_dir.mkdir()
    shutil.move(settings_py, settings_dir / "base.py")
    (settings_dir / "__init__.py").touch()

    (settings_dir / "dev.py").write_text(
        "from .base import *\nDEBUG = True\nALLOWED_HOSTS = ['*']\n",
        encoding="utf-8"
    )

    base_content = (settings_dir / "base.py").read_text()

    base_content = base_content.replace(
        "from pathlib import Path",
        "from pathlib import Path\nfrom decouple import config"
    )

    base_content = base_content.replace(
        "BASE_DIR = Path(__file__).resolve().parent.parent",
        "BASE_DIR = Path(__file__).resolve().parent.parent.parent"
    )

    base_content += """

SECRET_KEY = config('SECRET_KEY')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

INSTALLED_APPS += [
    'rest_framework',
]
"""

    (settings_dir / "base.py").write_text(base_content)


# =========================================================
# Apps
# =========================================================

def create_app(python, app_name):
    apps_dir = Path("apps")
    apps_dir.mkdir(exist_ok=True)
    run(f"{python} manage.py startapp {app_name} apps/{app_name}", shell=True)

    apps_py = apps_dir / app_name / "apps.py"
    content = apps_py.read_text()

    class_name = f"{app_name.capitalize()}Config"

    content = content.replace(
        "class Config(AppConfig):",
        f"class {class_name}(AppConfig):"
    )

    content = content.replace(
        "name =",
        f"name = 'apps.{app_name}'\n    default_auto_field = 'django.db.models.BigAutoField'\n"
    )

    apps_py.write_text(content)


def register_app(project_name, app_name):
    base = Path(project_name) / "settings" / "base.py"
    content = base.read_text()

    content = content.replace(
        "INSTALLED_APPS += [",
        f"INSTALLED_APPS += [\n    'apps.{app_name}.apps.{app_name.capitalize()}Config',"
    )

    base.write_text(content)


# =========================================================
# Main
# =========================================================

def main():
    project = input("Nome do projeto: ")
    apps = input("Apps (separados por espaço): ").split()

    python = setup_poetry()
    create_project(python, project)
    split_settings(project)

    for app in apps:
        create_app(python, app)
        register_app(project, app)

    Path(".env").write_text("SECRET_KEY=django-insecure-change-me\n")

    print("\n✅ Projeto criado corretamente")
    print(f"export DJANGO_SETTINGS_MODULE={project}.settings.dev")
    print(f"{python} manage.py migrate")
    print(f"{python} manage.py runserver")


if __name__ == "__main__":
    main()

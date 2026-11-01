# Cyberia

A personal library and routine tracker built with Django REST Framework and React.
Track books, movies, series, courses, meals, and weekly habits.

## Project structure

```text
backend_cyberia/
  apps/base/
    api/              Domain API endpoints
    models/           Domain models
    serializers/      Domain serializers
    tests/            Backend regression tests
    migrations/       Database migrations
  cyberia/settings/   Django configuration
  utils/              Backend utilities
  manage.py
  pyproject.toml
  poetry.lock
  requirements.txt
  .env.examples
  README.md
frontend_cyberia/
  src/features/       Screens, forms, and local styles by domain
  src/components/     Shared interface components
  src/hooks/          Shared collection hooks
  src/services/       API access and query cache
  package.json
  package-lock.json
  README.md
bruno/                  Bruno API collection and local environment
```

## Start with Docker

Install Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin
(Linux), and start Docker. Run these commands from the repository root:

```powershell
if (!(Test-Path backend_cyberia/.env)) { Copy-Item backend_cyberia/.env.examples backend_cyberia/.env }
docker run --rm python:3.14-slim python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Set `SECRET_KEY` in `backend_cyberia/.env` to the generated value, then run:

```powershell
docker compose up --build
```

Open `http://localhost:5173`. The database migrations run automatically.
All application collections use one local dataset and do not require login.
CSRF protection remains enabled for browser writes. The Docker environment does
not expose the Django administration panel or the backend port directly.
Daily meal notes are stored in the same persistent Docker database; notes from
older versions are imported from the browser on first use. Docker uses its own
database and uploads volumes; existing native-installation data stays separate.
See the [complete Docker guide](docs/docker.md) for the
architecture, persistence, backups, updates, and troubleshooting.
This Compose setup is intended for local use and publishes ports on loopback only.

## API requests with Bruno

Copy `bruno/environments/Local.example.bru` to
`bruno/environments/Local.bru`, open the `bruno/` directory in Bruno, and select
the `Local` environment. Run `Setup/Get CSRF token` before requests that write
data. Create requests save the returned IDs automatically for the matching
detail, update, and delete requests.

## Local setup

Requirements: Python 3.14+ and Node.js 20.19+ (or 22.12+).
Poetry is optional; the backend also supports pip and `requirements.txt`.

Start the backend from its own directory:

```powershell
cd backend_cyberia
poetry env use 3.14
poetry install --with dev --no-root
if (!(Test-Path .env)) { Copy-Item .env.examples .env }
poetry run python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Set `SECRET_KEY` in `backend_cyberia/.env` to the generated value, then run:

```powershell
poetry run python manage.py migrate
poetry run python manage.py runserver
```

For pip installation, environment variables, and session setup, see the
[backend guide](backend_cyberia/README.md#local-setup).

In a second terminal opened at the repository root:

```powershell
cd frontend_cyberia
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies API calls to `http://localhost:8000`.
See the [frontend guide](frontend_cyberia/README.md) for its structure and commands.

## Validation

Run from `backend_cyberia/`:

```powershell
poetry run task format
poetry run ruff check apps
poetry run python manage.py check
poetry run python manage.py test apps.base
```

Run from `frontend_cyberia/`:

```powershell
npm run build
npm test
```

The local environment file, SQLite database, and uploaded images live in
`backend_cyberia/` and stay outside version control. Commit `.env.examples`,
not `.env`. Frontend `dist/` and backend collected static files are ignored.

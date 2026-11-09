# Cyberia backend

Django REST API for the Cyberia React application.

For the container-based setup, see the [Docker guide](../docs/docker.md).

## Project structure

```text
apps/base/
  api/            Domain endpoints and request-data parsing
  models/         Django models grouped by domain
  serializers/    Domain serializers and shared source-handling mixin
  tests/          API, integration, and utility regression tests
  migrations/     Existing database migration history
  urls.py         Public API route registration
../frontend_cyberia/src/
  features/       books, media, courses, meals, routine, home, insights
  components/     Shared interface components
  hooks/          Shared collection hooks
  services/       API access and TanStack Query cache
  styles/         Shared styles and theme
```

Each frontend feature keeps its screen, form, and local styles together.
Backend domain modules use the same names across `api/`, `models/`, and
`serializers/`. Shared serializer behavior lives in `serializers/common.py`;
request-data normalization lives in `api/request_data.py`.

The backend packages re-export their public classes and views through
`__init__.py`, preserving imports such as `from apps.base.models import Book`.
Keep Django's app label `base` and the existing migrations when adding modules.
Run all backend commands from `backend_cyberia/`. Run the backend suite with `poetry run python manage.py test apps.base`.

## Local setup

Requirements: Python 3.14+, Poetry, and Node.js 20.19+ (or 22.12+).

From `backend_cyberia/` (run `cd backend_cyberia` from the repository root):

```powershell
poetry env use 3.14
poetry install --with dev --no-root
if (!(Test-Path .env)) { Copy-Item .env.examples .env }
poetry run python -c "import secrets; print(secrets.token_urlsafe(64))"
```

On macOS/Linux, use `cp -n .env.examples .env` to copy the example without overwriting an existing `.env`.
Paste the generated value into `SECRET_KEY` in `.env`. Keep this key private.
If `.env` already exists, keep it and add only missing variables.

`TMDB_ACCESS_TOKEN` is optional. Use your own TMDB **API Read Access Token**
(Bearer token), not an API key. Without it, TMDB search and automatic details
are unavailable; movie and series entries can still be added manually.
SQLite is configured automatically; no database credentials are needed.

Start the backend:

```powershell
poetry run python manage.py migrate
poetry run python manage.py runserver
```

In a second terminal opened at the repository root, start the frontend:

```powershell
cd frontend_cyberia
npm ci
npm run dev
```

Open `http://localhost:5173`. All API collections use one local dataset and do
not require login. `apps/base/csrf.py` issues the CSRF cookie and validates every
browser write. Daily meal notes are stored in the database and are included in
database backups.

Commit `.env.examples`; `.env`, the local database, uploads, and `dist/` are ignored.

### Using pip instead of Poetry

Poetry is optional for running the project. With Python 3.14+, create and activate
a virtual environment, then install the exported runtime dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --no-deps -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.examples .env }
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

On macOS/Linux, activate with `source .venv/bin/activate` and copy the example
with `cp -n .env.examples .env`. Set `SECRET_KEY` in `.env` to the generated value.
Then run `python manage.py migrate` and `python manage.py runserver`.
The frontend still uses `npm ci` and `npm run dev` in the sibling `../frontend_cyberia/` directory.

Maintainers should regenerate `requirements.txt` after updating `poetry.lock`:

```powershell
poetry self add poetry-plugin-export
poetry export --only main --format requirements.txt --without-hashes --output requirements.txt
```

Install the export plugin once. Commit the generated `requirements.txt` with the
lockfile changes. Development tools remain available through Poetry's `dev` group.

## Frontend and backend

The product interface is the React application in `../frontend_cyberia/`.
Run `npm install` and `npm run dev` there; Vite proxies `/api` to Django during development.

Django serves the REST API (`/api/v1/`) and API documentation (`/api/docs/`,
`/api/redoc/`). The former HTML pages, registration and seed-recovery interface
have been removed. Open the Vite URL for the product UI, not Django's root URL.

Django's template engine and staticfiles infrastructure remain enabled for installed
apps. `STATIC_ROOT` is the output of `collectstatic`, not the React build.
Uploaded images remain in `media/`; no existing data or uploads were removed.

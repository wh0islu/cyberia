# Running Cyberia with Docker

This configuration runs Cyberia locally with Docker Compose. You need Docker
and Git; Python, Node.js, and Poetry do not need to be installed on the host.
The existing native installation remains available as a separate option.

## 1. Prepare the environment

Install and start Docker Desktop on Windows/macOS, or Docker Engine and the
Compose plugin on Linux. From the repository root, verify the installation:

```sh
docker --version
docker compose version
```

Create your backend environment file without overwriting an existing one.
PowerShell:

```powershell
if (!(Test-Path backend_cyberia/.env)) { Copy-Item backend_cyberia/.env.examples backend_cyberia/.env }
```

macOS/Linux:

```sh
cp -n backend_cyberia/.env.examples backend_cyberia/.env
```

Generate a key using Docker:

```sh
docker run --rm python:3.14-slim python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Paste the result into `SECRET_KEY` in `backend_cyberia/.env`. Generate this key
once and keep it between restarts. `TMDB_ACCESS_TOKEN` is optional; enter your
own TMDB API Read Access Token to enable media search and automatic details.
The startup script rejects an empty SECRET_KEY or the example placeholder.
The environment file is injected at runtime and excluded from image builds.

## 2. Start the application

Stop any native server already occupying port 5173, then run:

```sh
docker compose up --build
```

The first build downloads images and dependencies and compiles React. Future
builds can reuse Docker's cached layers. Each backend startup applies pending
Django migrations before starting the server. A failed migration stops startup.
Compose waits for the backend health check before starting the frontend.

Open:

- Application: `http://localhost:5173`
- API documentation: `http://localhost:5173/api/docs/`

The Docker database starts empty and is separate from the native SQLite file.
All application collections use one local dataset and do not require login.
Browser writes require a CSRF cookie and token. Daily meal notes are stored in
the database, so the database backup includes them. Notes left by older versions
in browser storage are imported automatically on first use.

The backend is available only inside the Compose network. Nginx proxies API,
media, and static requests and returns `404` for `/admin/`.

To start in the background, use `docker compose up --build -d`.

## 3. Understand the files

| File | Responsibility |
| --- | --- |
| `compose.yaml` | Connects services, ports, health checks, environment variables, and volumes. |
| `backend_cyberia/Dockerfile` | Installs locked Python runtime dependencies and runs the backend as a non-root user. |
| `backend_cyberia/container_entrypoint.py` | Validates the key, applies migrations, and launches the container command. |
| `backend_cyberia/cyberia/settings/docker.py` | Selects persistent database/media paths and local host/CSRF settings. |
| `frontend_cyberia/Dockerfile` | Builds with Node, then copies the generated SPA into an Nginx image. |
| `frontend_cyberia/nginx.conf` | Serves the SPA and proxies backend requests. |
| `.dockerignore` in each application | Excludes secrets, local data, dependencies, caches, and build artifacts from its build context. |

An image is the packaged application. A container is a running instance of that
image. Compose starts both containers on a shared internal network; the frontend
reaches the backend using the service name `backend`, rather than `localhost`.

The browser accesses Nginx on port 5173. Nginx forwards backend requests while
preserving the host and cookies, keeping requests on the same browser origin.
Unknown frontend paths fall back to `index.html`, so refreshing `/books` works.
The frontend image contains the compiled app; source edits require a rebuild.
Native `npm run dev` remains the option for hot reloading during development.

The backend uses Django's development server with DEBUG enabled. Combined with
loopback-only published ports, this setup targets local personal use. A public
server deployment requires its own serving and security configuration.

## 4. Keep data between restarts

Compose creates two named volumes:

| Volume | Container path | Contents |
| --- | --- | --- |
| `database` | `/app/data` | SQLite database and related SQLite files. |
| `uploads` | `/app/media` | Uploaded book covers, movie posters, and meal photos. |

Docker prefixes the actual volume names with the Compose project name.
Restarting or rebuilding containers preserves these volumes. Keep the same
project name/directory to reuse the same volumes. Data is not copied into images
and is not committed to Git. Changing SECRET_KEY can invalidate existing sessions.

`docker compose down` removes the containers and network while keeping the data.
Adding `--volumes` to that command deletes the named volumes and their data.
Use the ordinary `down` command for normal shutdowns.

## 5. Common commands

Run from the repository root:

```sh
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose stop
docker compose start
docker compose down
```

`stop` pauses the services while preserving containers. `start` starts those
containers again. `down` removes them; use `up` to recreate them afterward.
After source changes, run `docker compose up --build -d`. After changing `.env`,
recreate the backend with `docker compose up -d --force-recreate backend frontend`;
a simple restart does not reload the environment file.

For validation and maintenance:

```sh
docker compose config --quiet
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test apps.base --noinput
```

## 6. Back up Docker data

Create a local `backups/` directory and stop the backend before copying SQLite:

```sh
mkdir backups
docker compose stop backend
docker compose cp backend:/app/data/db.sqlite3 backups/db.sqlite3
docker compose cp backend:/app/media backups/media
docker compose start backend
```

Use a new backup directory for each backup. Copying with the backend stopped
keeps database writes and uploads from changing during the backup.
These backups contain personal data and are ignored by Git.

To copy native-installation data into Docker, first make a backup and stop both
backends. Copy the native SQLite file and uploads into the stopped backend
container's mounted volume, then restore ownership to UID/GID 10001 before
starting it. Do not delete the original files until the imported data is verified.

## 7. Troubleshooting and verification

- Missing `docker` command: install Docker and reopen your terminal.
- Docker daemon unavailable: start Docker Desktop or the Docker service.
- Missing `.env`: copy the example before running Compose.
- Example key rejected: replace SECRET_KEY with a generated key.
- Port already in use: stop the native server using 5173.
- Backend unhealthy: inspect `docker compose logs backend`; migrations or configuration may have failed.
- TMDB unavailable: configure your own optional access token.
- Frontend changed but old code is shown: rebuild and refresh the browser.

The container build, service startup, Nginx syntax, backend tests, local-workspace
CRUD through the proxy, CSRF rejection, and upload-volume write access have been
verified with Docker. To repeat the main container checks:

```sh
docker compose build
docker compose up -d
docker compose exec frontend nginx -t
docker compose ps
```

Open the app, create an item, restart with `docker compose down` followed by
`docker compose up -d`, and confirm that the item and its uploaded image remain.

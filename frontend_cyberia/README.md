# Cyberia frontend

React and TypeScript interface for the Cyberia Django REST API.
See the [backend setup guide](../backend_cyberia/README.md#local-setup) for environment and backend installation.

## Organization

- `src/features/books/`: book library, reading progress, and book form.
- `src/features/media/`: movies, series, viewing progress, and media form.
- `src/features/courses/`: course library, details, and course form.
- `src/features/meals/`: meal calendar, entries, and meal form.
- `src/features/routine/`: habit tracking, schedule, and habit form.
- `src/features/home/` and `src/features/insights/`: dashboards.
- `src/components/`: shared buttons, dialogs, fields, navigation, and charts.
- `src/hooks/`: shared hooks for reading collection data.
- `src/services/`: API requests, deletion, preloading, and TanStack Query configuration.
- `src/styles/`: global styles and theme tokens.
- `tests/`: collection-cache and mutation regression tests.

Keep domain-specific forms and styles in their feature. Put components used by
multiple features in `src/components/`. Use the shared collection services for
mutations so lists and counters stay synchronized.

## Commands

Run from `frontend_cyberia/`:

```sh
npm ci
npm run dev
npm run build
npm test
npm run lint
```

Vite proxies `/api` to `http://localhost:8000` during development. Production
assets are generated in `dist/`, which stays outside version control. The
build splits React, charts, and query dependencies into separate bundles.

## Docker

Run `docker compose up --build` from the repository root after configuring the
backend environment file. The Dockerfile builds the SPA with Node and serves
only the generated files with Nginx. Nginx forwards `/api/`, `/media/`, and
`/static/` to the backend container, blocks `/admin/`, and supports direct SPA
route navigation.
See the [Docker guide](../docs/docker.md).

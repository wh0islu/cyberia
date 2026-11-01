# cyberia

my personal cyberia

Functions:

- Homepage
- Gallery
- Hobbies
- About
- Actives

## Frontend and backend

The product interface is the React application in `frontend_cyberia/`.
Run `npm install` and `npm run dev` there; Vite proxies `/api` to Django during development.

Django serves the REST API (`/api/v1/`), API documentation (`/api/docs/`, `/api/redoc/`),
and administration (`/admin/`). The former HTML pages, registration and seed-recovery
interface have been removed. Open the Vite URL for the product UI, not Django's root URL.

Django's template engine and staticfiles infrastructure remain enabled for the Admin
and installed apps. `STATIC_ROOT` is the output of `collectstatic`, not the React build.
Uploaded images remain in `media/`; no existing data or uploads were removed.

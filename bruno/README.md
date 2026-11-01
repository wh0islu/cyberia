# Cyberia API collection

Open this directory as a collection in Bruno and select the `Local` environment.
Start the Docker application, then run `Setup/Get CSRF token` once before sending
requests that create, update, or delete data. Bruno keeps the session cookie and
the setup request stores its matching token in `csrfToken`.

Run each domain in order when testing its complete CRUD flow: create, list, update,
and delete. Create requests store the returned identifier in the active environment.
TMDB requests require `TMDB_ACCESS_TOKEN` in the backend environment.

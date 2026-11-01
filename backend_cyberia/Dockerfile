FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=cyberia.settings.docker

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --no-deps -r requirements.txt

RUN groupadd --gid 10001 cyberia \
    && useradd --uid 10001 --gid cyberia --create-home cyberia \
    && mkdir -p /app/data /app/media \
    && chown -R cyberia:cyberia /app

COPY --chown=cyberia:cyberia . .

USER cyberia
EXPOSE 8000

ENTRYPOINT ["python", "container_entrypoint.py"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000", "--noreload"]

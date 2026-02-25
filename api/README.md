# Labshop's API

## Install dependencies
```bash
$ pip install -r requirements.txt
```

## Development Launching
```bash
$ fastapi dev main.py
```

## Docker Compose
Simply run
```bash
docker compose up
```

## Authentication (for Admin)
`SECRET_KEY` is required for encoding and decoding authentication token. You can generate by yourself.
```bash
$ openssl rand -hex 32
```

## Admin token generator (without creating admin user in DB)
```bash
$ python generate-token --username <username> --id <optional> --name <optional>
```
Please make sure to set `SECRET_KEY` in .env or environment variables
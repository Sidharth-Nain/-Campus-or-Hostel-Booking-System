# Backend setup

This directory contains the Day 3 FastAPI foundation. It exposes a health endpoint only. Authentication, database models, and booking routes are intentionally deferred to later days.

## First-time setup

From the project root in the VS Code terminal, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Start the API

```bash
uvicorn app.main:app --app-dir backend --reload
```

Then open these addresses in a browser:

- `http://127.0.0.1:8000/` — service information
- `http://127.0.0.1:8000/api/v1/health` — health check
- `http://127.0.0.1:8000/docs` — interactive API documentation

To prepare for PostgreSQL later, copy `backend/.env.example` to `backend/.env` and replace its placeholder connection string. Do not commit `.env` because it can contain passwords.

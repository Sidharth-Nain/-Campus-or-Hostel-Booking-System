# Backend setup

This directory contains the FastAPI foundation, the database layer, and Day 5 authentication. It exposes health, read-only facility, registration, login, and current-user endpoints. Booking creation, approval, and conflict handling are intentionally deferred to later days.

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
- `http://127.0.0.1:8000/api/v1/facilities` — seeded active facilities
- `http://127.0.0.1:8000/docs` — interactive API documentation

## Authentication endpoints

- `POST /api/v1/auth/register` creates a student account. The password is stored only as a secure hash.
- `POST /api/v1/auth/login` verifies the email and password, then returns a JWT access token.
- `GET /api/v1/auth/me` returns the logged-in user's safe profile. In the API docs, click **Authorize** and paste the access token returned by login.

The application uses a local SQLite file by default, so it works before PostgreSQL is installed. To use PostgreSQL, copy `backend/.env.example` to `backend/.env` and replace its placeholder connection string. Do not commit `.env` because it can contain passwords.

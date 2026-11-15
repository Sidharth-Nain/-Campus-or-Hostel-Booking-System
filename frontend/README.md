# CampusFlow React frontend

This is the active CampusFlow frontend. It includes React setup, hash-based routing, a shared layout, registration, login, session restoration, logout, a protected student dashboard, and Day 10 facility list/detail pages backed by live FastAPI data.

The original root-level HTML/CSS/JavaScript files remain as the UI prototype and design reference.

## First-time setup

Open the project in VS Code. In the terminal, run:

```bash
cd frontend
npm install
```

## Run CampusFlow locally

Use two VS Code terminals.

Terminal 1, from the project root:

```bash
source .venv/bin/activate
uvicorn app.main:app --app-dir backend --reload
```

Terminal 2, from the project root:

```bash
cd frontend
npm run dev
```

Open `http://127.0.0.1:5173` in the browser.

## Routes

- `#/register` creates a student through `POST /api/v1/auth/register` and signs them in.
- `#/login` signs in through `POST /api/v1/auth/login`.
- `#/dashboard` is protected and loads the profile through `GET /api/v1/auth/me`.
- `#/facilities` loads active spaces through `GET /api/v1/facilities`.
- `#/facilities/:id` loads one space through `GET /api/v1/facilities/{id}`.

The JWT is stored in local storage for this learning project. Logging out removes it.

## Environment setting

The default API address is `http://127.0.0.1:8000/api/v1`. To use another backend address, copy `.env.example` to `.env` and change `VITE_API_BASE_URL`.

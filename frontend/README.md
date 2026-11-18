# CampusFlow React frontend

This is the active CampusFlow frontend. It includes React setup, hash-based routing, a shared layout, authentication, protected dashboards, live facility pages, administrator facility management, and the complete Day 13 booking workflow backed by FastAPI data.

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
- `#/bookings` shows a student's booking history and cancellation controls.
- `#/admin/bookings` shows the administrator review queue with approval and rejection actions.
- `#/admin/facilities` lets administrators create, edit, deactivate, and restore facilities through the protected admin API.

Students can check a time slot and submit a request directly from a facility detail page. Administrators can approve or reject it from the request queue, and the student sees the new status after refreshing My bookings.

The JWT is stored in local storage for this learning project. Logging out removes it.

## Environment setting

The default API address is `http://127.0.0.1:8000/api/v1`. To use another backend address, copy `.env.example` to `.env` and change `VITE_API_BASE_URL`.

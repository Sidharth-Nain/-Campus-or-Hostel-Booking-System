# Campus Flow React frontend

This is the active Campus Flow frontend. It includes a public homepage, a live facility catalog, protected student and teacher booking workflows, seat pass reservations, and administrator controls backed by FastAPI data.

The original root-level HTML/CSS/JavaScript files remain as the UI prototype and design reference.

## First-time setup

Open the project in VS Code. In the terminal, run:

```bash
cd frontend
npm install
```

## Run Campus Flow locally

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

- `#/` previews nine live facilities with a Show more spaces control. Its booking preview and animated student conversation are illustrative and never make reservations.
- `#/register` creates a student through `POST /api/v1/auth/register` and signs them in.
- `#/login` signs in through `POST /api/v1/auth/login`.
- `#/dashboard` is protected and loads the profile through `GET /api/v1/auth/me`.
- `#/facilities` loads active spaces through `GET /api/v1/facilities`.
- `#/facilities/:id` loads one space through `GET /api/v1/facilities/{id}`.
- `#/teaching` lists rooms verified teachers can request for a class. Students can book individual seats in classrooms with a floor plan.
- `#/plans` compares four demo plans and lets students reserve and manage numbered seats.
- `#/bookings` shows a student's or teacher's one-time requests and cancellation controls.
- `#/admin/bookings` shows the administrator review queue with approval and rejection actions.
- `#/admin/facilities` lets administrators create, edit, deactivate, and restore facilities through the protected admin API.

On a facility detail page, students choose a time and check availability. In a lab, library, or classroom with a seat map, selecting and confirming a free seat books it immediately. Whole-space requests for courts and seminar halls go to the administrator's request queue. My bookings shows the reserved seat number or whole-space status.

The JWT is stored in local storage for this learning project. Logging out removes it.

## Environment setting

The default API address is `http://127.0.0.1:8000/api/v1`. To use another backend address, copy `.env.example` to `.env` and change `VITE_API_BASE_URL`.

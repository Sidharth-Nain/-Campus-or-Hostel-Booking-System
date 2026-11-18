# Backend setup

This directory contains the FastAPI foundation, database layer, authentication, student booking workflow, administrator review workflow, facility management, conflict prevention, and Day 13 booking-decision notifications. It exposes health, public facility, authentication, protected student booking, and admin-only management endpoints.

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

## Student booking endpoints

- `POST /api/v1/bookings/check-availability` checks a validated future interval without exposing another student's booking details.
- `POST /api/v1/bookings` creates a pending facility request for the logged-in student.
- `GET /api/v1/bookings` returns only that student's booking history.
- `GET /api/v1/bookings/{booking_id}` returns one owned booking without exposing other students' data.
- `PATCH /api/v1/bookings/{booking_id}/cancel` cancels an eligible pending or approved booking.

Booking requests must be in the future, include a timezone, end after they start, and last no more than 12 hours. Approved reservations block overlapping time slots. A student also cannot submit a second pending or approved request that overlaps their own request for the same facility. Adjacent slots are allowed because the end time is treated as exclusive.

Overlap checks are shared by availability, request creation, and administrator approval so all three paths use the same rule. On PostgreSQL, application startup installs an exclusion constraint as the final concurrency guard. If two administrators approve overlapping requests at almost the same time, the database accepts only one and the API returns a clear `409` response for the other.

## Administrator booking endpoints

- `GET /api/v1/admin/bookings` returns pending requests by default. Use `?status=approved`, `?status=rejected`, or `?status=all` to review other records.
- `PATCH /api/v1/admin/bookings/{booking_id}/approve` approves an available pending request.
- `PATCH /api/v1/admin/bookings/{booking_id}/reject` rejects a pending request.

Every approval or rejection queues a decision email after the database commit. During local development, CampusFlow prints a safe email preview in the FastAPI terminal. To send real email, add the SMTP settings from `.env.example` to `backend/.env`. Email failure is logged without undoing the administrator's saved decision.

Public registration always creates a student account. To make an existing local account an administrator, run this from the project root in a second VS Code terminal:

```bash
.venv/bin/python backend/scripts/promote_admin.py admin@campus.edu
```

Replace the example email with an account that was already registered through the API. Admin endpoints return `403` for student accounts. Approval checks for an existing approved overlap, and the PostgreSQL exclusion constraint remains the final concurrency protection during deployment.

## Administrator facility endpoints

- `GET /api/v1/admin/facilities` returns active and inactive facilities.
- `POST /api/v1/admin/facilities` creates an active facility after validating its name, location, capacity, and description.
- `PATCH /api/v1/admin/facilities/{facility_id}` edits a facility or restores it with `{"is_active": true}`.
- `DELETE /api/v1/admin/facilities/{facility_id}` safely deactivates a facility.

Deactivation is intentionally used instead of permanent deletion. It removes the facility from student-facing endpoints while preserving any booking history linked to it. Duplicate name-and-location combinations return `409`, and student accounts receive `403` on every management endpoint.

The application uses a local SQLite file by default, so it works before PostgreSQL is installed. To use PostgreSQL, copy `backend/.env.example` to `backend/.env` and replace its placeholder connection string. Do not commit `.env` because it can contain passwords.

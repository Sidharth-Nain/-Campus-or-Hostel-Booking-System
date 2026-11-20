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

## Student and teacher booking endpoints

- `POST /api/v1/bookings/check-availability` accepts `facility_id`, `starts_at`, and `ends_at`. Students booking seats receive the available seat numbers. Whole-space checks return availability for the entire venue.
- `POST /api/v1/bookings` with the same interval and a `seat_number` immediately confirms an available seat at a seat-enabled facility. Whole-space requests include a `purpose`, omit the seat number, and enter the pending queue.
- `GET /api/v1/bookings` returns only the signed-in account's booking history.
- `GET /api/v1/bookings/{booking_id}` returns one owned booking without exposing other students' data.
- `PATCH /api/v1/bookings/{booking_id}/cancel` cancels an eligible pending or approved booking.

Bookings must be in the future, include a timezone, end after they start, and last no more than 12 hours. A confirmed seat blocks that seat and an overlapping whole-room reservation. An approved whole-room booking blocks every seat. Different students can book different seats during the same interval. A student can hold one overlapping single-session booking per facility. Back-to-back bookings are allowed.

Overlap checks are shared by availability, request creation, and administrator approval so all three paths use the same rule. On PostgreSQL, application startup installs an exclusion constraint as the final concurrency guard. If two administrators approve overlapping requests at almost the same time, the database accepts only one and the API returns a clear `409` response for the other.

Verified teachers can request entire teaching rooms. Students can reserve seats in shared classrooms and use the whole-space request flow for courts and seminar venues. To enable teacher access for an existing student account, run `.venv/bin/python backend/scripts/promote_teacher.py teacher@example.com` from the project root. Existing bookings without seat assignments retain their original whole-space coverage when the server upgrades the database.

## Student seat passes

- `GET /api/v1/seat-passes/plans` lists four fixed-duration demo plans and INR prices.
- `GET /api/v1/seat-passes/availability` checks eligible numbered seats using `plan_id`, `facility_id`, and `starts_on`.
- `POST /api/v1/seat-passes` reserves a seat for the term; `GET /api/v1/seat-passes` lists the student's passes.
- `PATCH /api/v1/seat-passes/{id}/cancel` releases the seat from a non-expired pass.

Dates use Asia/Kolkata. The API returns an exclusive end date. A reserved pass blocks hourly bookings for that seat throughout its term, and a confirmed hourly booking prevents a new pass from claiming that seat during the same interval. A student can hold only one pass for overlapping dates. The plans do not charge, auto-renew, or send payment information anywhere.

## Administrator booking endpoints

- `GET /api/v1/admin/bookings` returns pending requests by default. Use `?status=approved`, `?status=rejected`, or `?status=all` to review other records.
- `PATCH /api/v1/admin/bookings/{booking_id}/approve` approves an available pending request.
- `PATCH /api/v1/admin/bookings/{booking_id}/reject` rejects a pending request.

Every approval or rejection queues a decision email after the database commit. During local development, Campus Flow prints an email preview in the FastAPI terminal. To send real email, add the SMTP settings from `.env.example` to `backend/.env`. Email failure is logged without undoing the administrator's saved decision.

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

The API adds missing entries from the 20-facility starter catalog on startup. Existing data is kept in the same database. Facilities expose capacity, category, amenities, and booking mode; the mode is fixed after creation to keep bookings and seat passes separate.

The application uses a local SQLite file by default, so it works before PostgreSQL is installed. To use PostgreSQL, copy `backend/.env.example` to `backend/.env` and replace its placeholder connection string. Do not commit `.env` because it can contain passwords.

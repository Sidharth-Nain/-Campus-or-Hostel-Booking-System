# Database Design

## Scope

The planned database is PostgreSQL. It contains the three Day 2 core entities: `users`, `facilities`, and `bookings`. The executable design is in [schema.sql](../sql/schema.sql). It is a schema plan, not a running Day 3 database service.

## Entity relationship summary

```text
users (1) ─────< bookings >───── (1) facilities
                 |
                 └── reviewed_by references users (admin)
```

A user can request many bookings. A facility can receive many bookings over time. Every booking has one requesting user and one facility. An approved or rejected booking records the administrator who reviewed it.

## Tables

### `users`

| Column | Type | Rules / purpose |
| --- | --- | --- |
| `id` | `BIGINT` identity | Primary key. |
| `full_name` | `VARCHAR(120)` | Required, at least two non-space characters. |
| `email` | `VARCHAR(254)` | Required, lowercase, unique, basic email-format check. |
| `password_hash` | `VARCHAR(255)` | Required password hash only. Plain-text passwords are never stored. |
| `role` | `user_role` | `student` by default; only `student` or `admin`. |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | Audit timestamps. |

### `facilities`

| Column | Type | Rules / purpose |
| --- | --- | --- |
| `id` | `BIGINT` identity | Primary key. |
| `name` | `VARCHAR(120)` | Required facility name. |
| `description` | `TEXT` | Required user-facing description. |
| `capacity` | `INTEGER` | Required and greater than zero. |
| `location` | `VARCHAR(160)` | Required campus location. |
| `is_active` | `BOOLEAN` | `true` when the facility can accept requests. |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | Audit timestamps. |

The pair `(name, location)` is unique so two records cannot accidentally represent the same named room at the same campus location.

### `bookings`

| Column | Type | Rules / purpose |
| --- | --- | --- |
| `id` | `BIGINT` identity | Primary key. |
| `user_id` | `BIGINT` foreign key | Requesting user. Deletes are restricted while bookings exist. |
| `facility_id` | `BIGINT` foreign key | Requested facility. Deletes are restricted while bookings exist. |
| `starts_at`, `ends_at` | `TIMESTAMPTZ` | Required, timezone-aware interval; end must be after start and no longer than 12 hours. |
| `purpose` | `VARCHAR(500)` | Required booking reason. |
| `status` | `booking_status` | `pending`, `approved`, `rejected`, or `cancelled`; defaults to `pending`. |
| `reviewed_by` | `BIGINT` foreign key | Administrator who made an approval/rejection; nullable for unreviewed requests. |
| `reviewed_at` | `TIMESTAMPTZ` | Time of admin decision; required with `reviewed_by`. |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | Audit timestamps. |

## Booking status flow

```text
pending ──approve──> approved
   │                     │
   ├──reject──> rejected │
   └──cancel─> cancelled ◄──cancel (if policy permits)
```

The later booking API will enforce who can make each transition. The Day 2 schema ensures that an `approved` or `rejected` row has both review fields, while a `pending` or `cancelled` row does not.

## Overlap rule

Two **approved** bookings for the same facility cannot overlap. The schema uses PostgreSQL’s `EXCLUDE USING gist` constraint with a `tstzrange(starts_at, ends_at, '[)')`:

- `[)` makes the start inclusive and end exclusive.
- A booking from 10:00 to 11:00 does not conflict with one from 11:00 to 12:00.
- A booking from 10:00 to 11:00 conflicts with one from 10:30 to 11:30.
- Pending, rejected, and cancelled requests do not block a time slot.

`btree_gist` is enabled to allow the equality comparison on `facility_id` within the exclusion constraint. The Day 3 approval endpoint must still handle a constraint-violation response, because two staff members might approve competing requests at nearly the same time.

## Indexes and Day 3 implementation notes

- `bookings_facility_time_idx` supports availability checks for a facility and time range.
- `bookings_user_created_idx` supports a student's booking history.
- `bookings_pending_review_idx` supports the admin review queue.
- The API must verify that the requesting user has the `student` role and that the reviewer has the `admin` role.
- The API must refuse a request for inactive facilities and validate input in the server's chosen timezone policy.
- A database trigger for `updated_at` is intentionally deferred until backend/migration conventions are chosen on Day 3.

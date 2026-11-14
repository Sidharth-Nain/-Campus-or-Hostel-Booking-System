# CampusFlow

### Smart Campus Facility Booking & Management System

**Project:** ALTA BUILDER 30 | Track A — Full-Stack Development
**Duration:** 15 Days
**Development Stage:** Frontend authentication integration
**Project Type:** Full-Stack Web Application

---

## 01. Project Overview

CampusFlow is a web-based facility reservation and management platform designed to simplify how educational institutions manage shared campus resources.

The platform will provide a centralized system where students and faculty can explore available facilities, check booking availability, submit reservation requests, and monitor their booking status.

Administrators will have a dedicated interface to manage facilities, review requests, and maintain organized booking schedules.

The objective is to replace fragmented, manual booking processes with a transparent, accessible, and efficient digital solution.

## 02. The Problem We're Solving

Educational institutions have multiple shared facilities, including seminar halls, computer laboratories, conference rooms, and sports facilities.

Managing reservations for these resources can become challenging when bookings rely on manual registers, informal communication, or disconnected spreadsheets.

### Key Challenges

- **Limited visibility:** Students and faculty may not know whether a facility is available.
- **Scheduling conflicts:** Multiple requests may be made for the same facility and time slot.
- **Manual coordination:** Booking approvals often require repeated communication.
- **Lack of transparency:** Users may have difficulty tracking their reservation status.
- **Inefficient record management:** Administrators may struggle to maintain accurate booking histories.

CampusFlow aims to address these challenges through a unified booking and management system.

## 03. Our Approach

CampusFlow will follow a request-and-approval booking model.

Users will be able to browse campus facilities, select a preferred date and time, and submit a reservation request.

The backend will validate the request, check scheduling conflicts, and store the reservation. Authorized administrators will review pending requests and approve or reject them.

The application will prioritize three principles:

1. **Simplicity:** A clean interface requiring minimal effort to navigate.
2. **Reliability:** Consistent booking validation and conflict prevention.
3. **Transparency:** Clear reservation statuses and accessible booking history.

## 04. Who Will Use CampusFlow?

### Student

Students will be able to:

- Create an account and sign in.
- Browse available campus facilities.
- View facility details and availability.
- Request facility reservations.
- Track booking status.
- Cancel eligible bookings.
- Review previous reservations.

### Faculty

Faculty members will be able to:

- Access available institutional facilities.
- Submit reservations for academic activities.
- Review upcoming and previous bookings.
- Cancel eligible reservations.

For the initial version, faculty and students will share the same booking permissions.

### Administrator

Administrators will be responsible for:

- Creating and updating facility listings.
- Managing facility availability.
- Reviewing pending booking requests.
- Approving or rejecting reservations.
- Monitoring booking records.
- Preventing scheduling conflicts.

Administrative permissions will be restricted to authorized accounts.

## 05. Product Scope & Features

### Core Features — Minimum Viable Product

**Authentication & Access Control**

- Account registration and secure login.
- Password hashing and authenticated access.
- Role-based authorization for administrative actions.

**Facility Management**

- Facility directory with essential details.
- Facility capacity and location information.
- Administrative controls to add, update, or deactivate facilities.

**Booking Management**

- Date and time-slot selection.
- Reservation request submission.
- Availability and overlap validation.
- Booking status tracking.
- Reservation cancellation.
- Administrator approval and rejection.

**User Dashboard**

- Upcoming reservations.
- Pending booking requests.
- Booking history and status information.

**Administrator Dashboard**

- Pending reservation queue.
- Booking approval and rejection.
- Facility management controls.
- Reservation overview.

### Planned Enhancements

Subject to completion of the core application:

- Interactive calendar-based availability.
- Email notifications for booking decisions.
- Advanced facility search and filtering.
- Improved mobile-responsive interface.

### Future Expansion

Potential improvements beyond the initial challenge:

- Institutional email verification.
- QR-based facility check-in.
- Facility utilization analytics.
- Recurring reservations.
- Maintenance and blackout schedules.
- Multi-campus support.

## 06. Technology & Development Tools

| Technology            | Responsibility                        |
| --------------------- | ------------------------------------- |
| HTML5                 | Webpage structure                     |
| CSS3                  | Styling and responsive layouts        |
| JavaScript            | Frontend interactions                 |
| React                 | Component-based user interface        |
| Python                | Backend programming                   |
| FastAPI               | REST API development                  |
| SQLModel / SQLAlchemy | Database models and access            |
| SQLite                | Initial development database          |
| PostgreSQL            | Target production database            |
| Git & GitHub          | Version control and progress tracking |
| Vercel                | Planned frontend hosting              |
| Render                | Planned backend hosting               |

The final technology choices may be adjusted based on deployment compatibility, development constraints, and project requirements.

## Running the current application

CampusFlow now has a React frontend in `frontend/` and a FastAPI backend in `backend/`. Start them in two VS Code terminals.

**Terminal 1 — backend:**

```bash
source .venv/bin/activate
uvicorn app.main:app --app-dir backend --reload
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The React app includes registration, login, JWT session restoration, logout, protected routing, and a shared CampusFlow layout. Facility list and detail pages will be connected to live API data in the next scheduled frontend task.

## 07. System Architecture

CampusFlow will use a client-server architecture with a separate frontend, backend API, and database.

**Architecture Flow**

```text
Student / Faculty / Administrator
               |
               v
       React Frontend
               |
        HTTPS Requests
               |
               v
         FastAPI Backend
               |
      Authentication
      Booking Validation
      Role Authorization
      Business Logic
               |
               v
       Database Layer
               |
        PostgreSQL
```

### Frontend Layer

The React application will handle navigation, forms, facility listings, dashboards, and user interactions.

### Backend Layer

FastAPI will process requests, validate data, enforce permissions, and implement booking-related business rules.

### Database Layer

The database will maintain user accounts, facility information, reservation records, and booking statuses.

### API Communication

The frontend and backend will communicate through REST APIs using JSON data.

Example planned endpoints:

| Method | Endpoint                      | Purpose                     |
| ------ | ----------------------------- | --------------------------- |
| POST   | `/auth/register`              | Register an account         |
| POST   | `/auth/login`                 | Authenticate a user         |
| GET    | `/facilities`                 | Retrieve facilities         |
| GET    | `/facilities/{id}`            | Retrieve facility details   |
| POST   | `/bookings`                   | Submit a reservation        |
| GET    | `/bookings/me`                | Retrieve user bookings      |
| PATCH  | `/bookings/{id}/cancel`       | Cancel an eligible booking  |
| PATCH  | `/admin/bookings/{id}/status` | Approve or reject a request |

These endpoints represent the proposed API contract and may evolve during implementation.

## 08. Data Model

The initial database will contain three primary entities.

### Users

| Field         | Description                        |
| ------------- | ---------------------------------- |
| id            | Unique user identifier             |
| name          | Full name                          |
| email         | Unique email address               |
| password_hash | Securely hashed password           |
| role          | Student, faculty, or administrator |
| created_at    | Account creation timestamp         |

### Facilities

| Field       | Description                            |
| ----------- | -------------------------------------- |
| id          | Unique facility identifier             |
| name        | Facility name                          |
| description | Facility information                   |
| location    | Campus location                        |
| capacity    | Maximum occupancy                      |
| is_active   | Facility availability for new requests |

### Bookings

| Field       | Description                               |
| ----------- | ----------------------------------------- |
| id          | Unique reservation identifier             |
| user_id     | Reference to requesting user              |
| facility_id | Reference to selected facility            |
| start_time  | Reservation start                         |
| end_time    | Reservation end                           |
| purpose     | Reason for reservation                    |
| status      | Pending, approved, rejected, or cancelled |
| created_at  | Request creation timestamp                |

**Relationships**

- One user can create multiple bookings.
- One facility can have multiple bookings across different time slots.
- Every booking belongs to one user and one facility.

## 09. Reservation Lifecycle

The planned reservation process follows these stages:

**Step 1 — Authentication**

A user signs in to the application.

**Step 2 — Facility Discovery**

The user browses available facilities and selects one.

**Step 3 — Time Selection**

The user selects a date, start time, and end time.

**Step 4 — Validation**

The backend checks whether:

- The facility exists and is active.
- The requested time range is valid.
- The selected time does not conflict with an existing reservation or blocked pending request.

**Step 5 — Request Submission**

A valid request is stored with the status `pending`.

**Step 6 — Administrative Review**

An administrator reviews the request and approves or rejects it.

Availability is revalidated during approval to prevent conflicting reservations.

**Step 7 — Status Update**

The user can view the final decision through their dashboard.

### Booking Rules

- A reservation must have a valid start and end time.
- Users cannot reserve inactive facilities.
- Overlapping approved reservations for the same facility are prohibited.
- Conflicting pending requests will be blocked in the initial implementation.
- Users can cancel only their own eligible bookings.
- Only authorized administrators can approve or reject requests.
- Booking conflict checks must be enforced by the backend and protected against concurrent updates.

## 10. Planned Repository Organization

```text
campusflow/
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |-- package.json
|
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- models/
|   |   |-- routes/
|   |   |-- schemas/
|   |   |-- services/
|   |   |-- database.py
|   |-- requirements.txt
|
|-- docs/
|-- .gitignore
|-- README.md
```

This structure separates frontend presentation, backend business logic, database models, and project documentation.

## 11. Development Roadmap

The project will be developed across 15 days, with a focus on delivering a functional application within the ALTA BUILDER 30 timeline.

| Day | Development Focus                | Target Deliverable                                  |
| --- | -------------------------------- | --------------------------------------------------- |
| 1   | Project planning                 | Requirements, architecture, initial README          |
| 2   | Repository and environment setup | Organized development environment                   |
| 3   | UI foundation                    | Facility listing and page layouts                   |
| 4   | React application structure      | Reusable frontend components                        |
| 5   | Initial frontend milestone       | Working interface and progress update               |
| 6   | FastAPI backend setup            | Functional REST endpoints                           |
| 7   | Database integration             | Persistent facility and booking records             |
| 8   | Authentication                   | Registration, login, protected routes               |
| 9   | Reservation system               | Booking creation and validation                     |
| 10  | Booking dashboard                | User booking history and progress update            |
| 11  | Administrative workflow          | Approval and rejection functionality                |
| 12  | Advanced feature and refinement  | Availability interface and reliability improvements |
| 13  | Testing and debugging            | Verified core workflows                             |
| 14  | Deployment and integration       | Accessible hosted application                       |
| 15  | Final verification               | README, demonstration, deployed project             |

The roadmap is a proposed implementation schedule and will be aligned with the official challenge sheet.

## 12. Quality Assurance & Testing

CampusFlow will be tested across functionality, validation, security, and usability.

### Functional Testing

- User registration and login.
- Facility listing and detail retrieval.
- Booking submission.
- Booking cancellation.
- Administrative approval and rejection.
- Booking history and status updates.

### Validation & Edge Cases

- Invalid or missing form inputs.
- End time earlier than start time.
- Requests for past time slots.
- Overlapping reservations.
- Duplicate or concurrent booking requests.
- Booking requests for inactive facilities.
- Unauthorized administrative operations.

### Security Testing

- Passwords must not be stored in plaintext.
- Protected endpoints must require authentication.
- Administrative operations must enforce role permissions.
- Users must not access or modify another user's private reservations.
- Secrets and credentials must not be committed to GitHub.

### Usability Testing

- Responsive layouts across screen sizes.
- Clear error and success messages.
- Accessible form labels and controls.
- Consistent navigation.

## 13. Deployment Strategy

The application is planned to be deployed using separate hosting services.

**Frontend — Vercel**

The React application will be built and deployed as a publicly accessible website.

**Backend — Render**

The FastAPI application will be hosted as a web service exposing HTTPS API endpoints.

**Database — Hosted PostgreSQL**

A managed PostgreSQL database will store persistent application data.

**Environment Configuration**

Database credentials, authentication secrets, and deployment-specific settings will be managed using environment variables rather than hardcoded values.

The live application will be tested after deployment to verify communication between all components.

## 14. Development Principles

CampusFlow will be developed with the following priorities:

1. Build a functional minimum viable product before introducing optional features.
2. Keep frontend, backend, and database responsibilities clearly separated.
3. Validate important operations on the server.
4. Use GitHub to maintain a transparent development history.
5. Test features before considering them complete.
6. Use AI-assisted development responsibly, with an emphasis on understanding and verifying generated implementations.
7. Document important design decisions, limitations, and lessons learned.

## 15. Success Criteria

CampusFlow will be considered ready for its initial release when:

- Students and faculty can authenticate successfully.
- Facilities can be browsed and selected.
- Users can submit valid booking requests.
- Conflicting reservations are prevented.
- Administrators can review and process requests.
- Users can track and cancel eligible reservations.
- Core application workflows pass testing.
- The frontend and backend are deployed and accessible.
- The GitHub repository contains clear documentation and development history.

## 16. Project Vision

CampusFlow is intended to demonstrate how a practical institutional problem can be addressed through full-stack software development.

Beyond the challenge, the project has the potential to evolve into a campus-wide resource management platform with improved scheduling, automation, and facility utilization insights.

The final objective is to deliver a functional, understandable, and maintainable application that demonstrates real-world software engineering skills.

---

**CampusFlow — Making Campus Spaces Easier to Access.**

*Developed as part of ALTA BUILDER 30 | Track A — Full-Stack Development.*

*#ALTABuilder30*

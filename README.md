# Biometric Attendance Backend

This repository is a simple Node.js + Express backend for a student biometric attendance app using Sequelize and SQLite. It provides endpoints for students, teachers, courses, enrollment, attendance, and an admin dashboard. The project is Dockerized and can be run locally with Docker Compose or deployed to Render using a Dockerfile.

---

## Quick status

- Server: Express + Sequelize (SQLite by default)
- DB: SQLite file `database.sqlite` stored in project root (recommended to persist when deploying)
- Docker: `Dockerfile` and `docker-compose.yml` included

## What I changed/added (useful context)

- Added GET endpoints for listing students, teachers, and courses.
- Added `src/middleware/requestCounter.js` — simple in-memory request counting middleware used by the admin dashboard.
- Added `src/routes/admin.route.js` — JSON stats (`/admin/stats`) and an HTML admin dashboard (`/admin/dashboard`).
- Updated `src/models/index.js` to avoid force-sync by default; use `FORCE_SYNC=true` when you want destructive sync.
- Dockerfile switched to Debian-based image and includes build tools so native modules (sqlite3) install reliably.
- `docker-compose.yml` mounts `./database.sqlite` into the container to persist the DB file.

## Run locally with Docker Compose (recommended)

Prerequisites:

- Docker and Docker Compose installed

Start the app:

```bash
docker-compose up --build
```

This will build the image and start the service on port 3000. The SQLite file `database.sqlite` will be created in the project root and is mounted into the container.

To stop:

```bash
docker-compose down
```

Alternative: build and run the image directly

```bash
docker build -t biometric_app-app .
docker run -p 3000:3000 -v "$(pwd)/database.sqlite:/usr/src/app/database.sqlite" biometric_app-app
```

## Environment variables

- PORT — Port for the server (server currently uses 3000 by default; recommended to update `src/server.js` to use `process.env.PORT || 3000`).
- DB_DIALECT — Default: `sqlite` (already set in config). Other options (mysql/postgres) will require installing the appropriate driver.
- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST — used by `src/config/database.js` when dialect != sqlite
- FORCE_SYNC — Set to `true` only in development to force sequelize to recreate tables.

Example when running with docker-compose (already configured in `docker-compose.yml`):

- NODE_ENV=production
- DB_DIALECT=sqlite
- DB_NAME=attendance_db
- FORCE_SYNC=false

## API Reference

Base URL: http://localhost:3000

All routes are JSON based (except the admin dashboard HTML) and return JSON responses.

- Students (/students)

  - POST /students/register
    - Body: { "name": string, "email": string, "password": string }
    - Success: 201 Created, { message: "Student created successfully", student }
  - POST /students/login
    - Body: { "email": string, "password": string }
    - Success: 200 OK, { message: "Login successful", student }
  - GET /students
    - Lists students (attributes: stdId, name, email)

- Teachers (/teachers)

  - POST /teachers/register
    - Body: { "name": string, "email": string, "password": string }
    - Success: 201 Created, { message: "Teacher registered successfully", teacher }
  - POST /teachers/login
    - Body: { "email": string, "password": string }
    - Success: 200 OK, { message: "Login successful", student }
  - GET /teachers
    - Lists teachers (attributes: teacherId, name, email)

- Courses (/courses)

  - POST /courses
    - Body: { "title": string, "startTime": ISODateString, "endTime": ISODateString, "instructorID": number }
    - Success: 201 Created, { message: "course registered successfully", course }
  - GET /courses
    - Lists courses (courseID, title, startTime, endTime, instructorID)

- Enrollments (/enrollments)

  - POST /enrollments
    - Body: { "stdId": number, "courseID": number }
    - Success: 201 Created, { message: "Enrolled successfully", enrollement }

- Attendance (route exists but may be commented out in route mounting)

  - POST /attendance
    - Body: { "stdId": number, "courseID": number, "fingerprinthash": string, "latitude": string, "longitude": string }
    - Validations performed (enrolled check, course time check, location within school radius, fingerprint length)
    - Success: 200 OK, { message: "Attendance recorded", attendance }
  - Note: `src/routes/index.js` currently has the attendance route commented out. To enable it, import and mount it there.

- Admin (/admin)
  - GET /admin/stats
    - Returns JSON with request counters, counts and lists of students, teachers, and courses.
  - GET /admin/dashboard
    - Returns an HTML page summarizing counters and listing students/teachers/courses.
    - Warning: Dashboard is not authenticated. Protect it before exposing publicly.

### Example curl requests

Create a student:

```bash
curl -X POST http://localhost:3000/students/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"pass"}'
```

List students:

```bash
curl http://localhost:3000/students
```

Create a course:

```bash
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Math 101","startTime":"2025-12-18T08:30:00Z","endTime":"2025-12-18T09:30:00Z","instructorID":1}'
```

Enroll a student:

```bash
curl -X POST http://localhost:3000/enrollments \
  -H "Content-Type: application/json" \
  -d '{"stdId":1,"courseID":1}'
```

Record attendance (example):

```bash
curl -X POST http://localhost:3000/attendance \
  -H "Content-Type: application/json" \
  -d '{"stdId":1,"courseID":1,"fingerprinthash":"abc12345","latitude":"4.1533","longitude":"9.2927"}'
```

Admin dashboard (HTML):

```bash
open http://localhost:3000/admin/dashboard
```

## Deploy on Render (Docker)

Render supports deploying a single service from a Git repo with a Dockerfile.

High-level steps:

1. Push this repo to a Git provider (GitHub/GitLab).
2. Create a new Web Service on Render and choose "Docker" as the environment.
3. Connect your repository and choose the branch.
4. In the service settings set these environment variables:
   - NODE_ENV=production
   - DB_DIALECT=sqlite
   - DB_NAME=attendance_db
   - FORCE_SYNC=false
   - (optional) PORT=10000 or let Render provide $PORT — recommended: update `src/server.js` to use `process.env.PORT || 3000`.
5. Enable a Persistent Disk in Render and mount it to the container path where SQLite file is stored (the project expects `./database.sqlite` in the working directory `/usr/src/app`). In Render's UI, mount the persistent disk to `/usr/src/app` (or to a subdirectory and update `storage` path in `src/config/database.js`).
6. Deploy and monitor the logs. The server will start and Sequelize will create `database.sqlite` in the persistent disk location.

Notes about Render specifics:

- Render does not run docker-compose — it runs a single container per service. Our `Dockerfile` is sufficient.
- Persisting the SQLite file: Render supports a persistent disk for a service. You must mount it to a path inside the container (e.g., `/usr/src/app`) so `./database.sqlite` maps to the persistent storage. Without a persistent disk, the DB will be ephemeral and lost on deploy/scale.
- For production, consider using a managed database (Postgres) instead of SQLite. If you switch to Postgres you should update `src/config/database.js` to use the Postgres dialect and provide the appropriate env vars and credentials, and install `pg` (npm package). Render provides managed Postgres as a separate service.

## Recommended small code change (optional but advised)

- Update `src/server.js` to use `process.env.PORT || 3000` instead of a hard-coded 3000 so Render's `$PORT` or a custom env `PORT` is honored. I can patch this for you if you want.

## Security & production notes

- The admin dashboard is not protected — add basic auth or JWT before exposing it publicly.
- Passwords are stored as plaintext in the models; for production, hash passwords (bcrypt) and never store plaintext. Add password hashing on create and password comparison on login.
- Add input validation (Joi or Zod) to prevent malformed input.
- Consider using migrations (sequelize-cli or umzug) instead of `sequelize.sync` in production to manage schema changes safely.

## Want me to add anything else?

- I can update `src/server.js` to read `process.env.PORT` and patch `package.json` with `start`/`dev` scripts.
- I can add Basic Auth for `/admin/*` endpoints.
- I can persist the request counters into SQLite so dashboard counters persist across restarts.

If you want I will make the small recommended change to `src/server.js` now (allow PORT from env) and add `start`/`dev` npm scripts. Say which you'd like and I will implement them.

# Complaint Management System — Backend API

Backend-only REST API for a Complaint Management System. Built with **Next.js App Router**, **Prisma**, **MySQL**, **JWT**, and **bcrypt**. Designed to be consumed by a Flutter mobile app — no frontend UI beyond a stub home page.

## Stack

- Next.js 16 (App Router API routes)
- TypeScript
- MySQL + Prisma ORM
- JWT authentication (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Request validation (`zod`)
- Local file storage under `/uploads` (swappable for S3 later)

## Prerequisites

- Node.js 20+
- MySQL 8 running locally

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the MySQL database

Use a **new** database for this project (do not reuse other apps' DBs):

```sql
CREATE DATABASE complaint_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string for `complaint_management` |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seeded admin account |
| `UPLOAD_DIR` | Local upload folder (default `uploads`) |

### 4. Migrate & seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

This creates tables and one **Admin** user from `.env`.

### 5. Run the API

```bash
npm run dev
```

API base: `http://localhost:3000`

Send JWT as: `Authorization: Bearer <token>`

---

## Roles

| Role | How created | Capabilities |
|------|-------------|--------------|
| `USER` | Public signup | File/view own complaints; see final resolution only when `RESOLVED` |
| `ADMIN` | Seed script only (no public signup) | Manage departments & dept heads; view all complaints; forward; internal comments |
| `DEPARTMENT_HEAD` | Admin master-data API only | View assigned complaints; internal comments; resolve with final comment |

---

## Business flow

1. User signs up and completes profile.
2. User files a complaint (`OPEN`) with optional image/PDF attachments.
3. Admin forwards it to a department head → `IN_PROGRESS`.
4. Admin ↔ Dept Head discuss via **internal comments** (never shown to users).
5. Dept Head resolves with a **final resolution comment** → `RESOLVED`.
6. User sees status always; final resolution comment only after resolve.

---

## API Endpoints

All success responses:

```json
{ "success": true, "data": { } }
```

All error responses:

```json
{ "success": false, "message": "..." }
```

### Auth

#### `POST /api/auth/signup` — Public (USER only)

Request:

```json
{
  "name": "Ali Khan",
  "email": "ali@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Ali Khan",
      "email": "ali@example.com",
      "role": "USER",
      "profileCompleted": false
    },
    "token": "<jwt>"
  }
}
```

#### `POST /api/auth/login` — Public (all roles)

Request:

```json
{
  "email": "admin@cms.local",
  "password": "Admin@12345"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "role": "ADMIN", "email": "admin@cms.local" }
  }
}
```

### User profile

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/users/me` | Any authenticated |
| `PUT` | `/api/users/me` | Any authenticated |

`PUT` body example:

```json
{
  "name": "Ali Khan",
  "phone": "+923001234567",
  "address": "Lahore"
}
```

Sets `profileCompleted: true`.

### Departments

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/departments` | Any authenticated |
| `POST` | `/api/admin/departments` | `ADMIN` |

Create body:

```json
{ "name": "Public Works" }
```

### Department heads (master data)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/admin/department-heads` | `ADMIN` |
| `POST` | `/api/admin/department-heads` | `ADMIN` |
| `PUT` | `/api/admin/department-heads/:id` | `ADMIN` |
| `DELETE` | `/api/admin/department-heads/:id` | `ADMIN` |

Create body:

```json
{
  "name": "Sara Ahmed",
  "email": "sara@cms.local",
  "password": "Head@12345",
  "departmentId": "<department-id>"
}
```

### Complaints — User

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/complaints` | `USER` |
| `GET` | `/api/complaints` | `USER` (own only) |
| `GET` | `/api/complaints/:id` | `USER` (own only) |

Create (`multipart/form-data`):

- `title` (string)
- `description` (string)
- `departmentId` (string)
- `attachments` (optional files; images + PDF; max 5MB each)

User detail includes `finalResolution` **only** when status is `RESOLVED`. Internal comments are never returned.

### Complaints — Admin

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/admin/complaints?status=OPEN` | `ADMIN` |
| `GET` | `/api/admin/complaints/:id` | `ADMIN` |
| `PUT` | `/api/admin/complaints/:id/forward` | `ADMIN` |
| `POST` | `/api/admin/complaints/:id/comments` | `ADMIN` |

Forward body:

```json
{ "assignedDeptHeadId": "<dept-head-user-id>" }
```

Comment body:

```json
{ "comment": "Please inspect the site this week." }
```

### Complaints — Department Head

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/depthead/complaints` | `DEPARTMENT_HEAD` (assigned only) |
| `GET` | `/api/depthead/complaints/:id` | `DEPARTMENT_HEAD` (assigned only) |
| `POST` | `/api/depthead/complaints/:id/comments` | `DEPARTMENT_HEAD` |
| `PUT` | `/api/depthead/complaints/:id/resolve` | `DEPARTMENT_HEAD` |

Resolve body (single transaction: final comment + status `RESOLVED`):

```json
{ "comment": "Issue fixed. Drain cleared on 2026-09-04." }
```

### File downloads

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/uploads/complaints/:complaintId/:filename` | Public path (URL from attachment `fileUrl`) |

Files are stored under `/uploads/complaints/{complaintId}/`. Storage logic lives in `src/lib/storage.ts` so it can later be replaced with S3.

---

## Useful scripts

```bash
npm run dev          # start API
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed admin
npm run db:studio    # Prisma Studio
npm run build        # production build
```

## Project structure (API)

```
prisma/schema.prisma
prisma/seed.ts
src/lib/auth.ts
src/lib/prisma.ts
src/lib/storage.ts
src/lib/validators.ts
src/app/api/auth/...
src/app/api/users/me/...
src/app/api/departments/...
src/app/api/admin/...
src/app/api/complaints/...
src/app/api/depthead/...
src/app/api/uploads/...
uploads/
```

## Notes for Flutter client

1. Store the JWT from login/signup and send it on every request.
2. Use `multipart/form-data` for complaint creation with attachments.
3. Never expect internal comments on user endpoints — only `finalResolution` after resolve.
4. Dept head accounts cannot self-register; admin creates them.

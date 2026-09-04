# MNFSR Complaints Portal — Flutter API Guide

Complete backend contract for integrating the **Complaint Management System** in Flutter (Admin, Department Head / HOD, Citizen / User).

| Item | Value |
|------|--------|
| Base URL (local) | `http://localhost:3000` |
| API prefix | `/api` |
| Content-Type | `application/json` (except complaint create = `multipart/form-data`) |
| Auth | `Authorization: Bearer <JWT>` |
| Token lifetime | `7d` (server env `JWT_EXPIRES_IN`) |

Replace `BASE_URL` with your deployed host (e.g. `https://api.example.com`).

---

## 0. Brand & UI (match the web app)

Use these tokens so the Flutter app looks like the MNFSR web portal (forest green, mint surfaces — **not** purple/indigo).

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `primary` / `--mnfsr-green` | `#0F3D26` | Primary buttons, active nav, links, sidebar base |
| `primaryDark` | `#0A2E1C` | Pressed states, dark text accents |
| `primaryMid` | `#1B5E3B` | Gradients mid stop |
| `primarySoft` | `#2F7D52` | Focus rings, soft accents |
| `mint` / page bg | `#EEF5F0` | Scaffold / screen background |
| `mintDeep` | `#E1EBE4` | Secondary button hover, soft fills |
| `card` | `#FFFFFF` | Cards, sheets, inputs surface |
| `border` | `#D9E5DD` | Borders, dividers |
| `text` | `#15261D` | Primary body text |
| `muted` | `#6B7C72` | Secondary text, labels, captions |
| `danger` | `#B91C1C` | Delete / error actions |
| `errorBg` | `#FEF2F2` | Error alert background |
| `successBg` | `#ECFDF5` | Success alert background |

### Status colors

| Status | Accent | Badge background | Badge text feel |
|--------|--------|------------------|-----------------|
| `OPEN` | `#D97706` | `#FFF7ED` | warm orange |
| `IN_PROGRESS` | `#2563EB` | `#EFF6FF` | blue |
| `RESOLVED` | `#16A34A` | `#ECFDF5` | green |

### Gradients (use where web uses them)

**Primary button**

```text
linear: #14532D → #0F3D26 → #0C4A3A  (angle ~135°)
```

**Auth left panel / sidebar**

```text
linear: #1A472A → #12331E  (or deeper: #114A30 → #0F3D26 → #082418)
```

**Hero banners (dashboards)**

```text
deep greens + soft teal: #062417 → #0F3D26 → #1A6B45 → #0D4A55
HOD hero similar: #052519 → #0E3A28 → #176B4F → #0F4F6B
```

### Typography

| Item | Value |
|------|--------|
| Font | **DM Sans** (Google Fonts) — web uses `next/font` `DM_Sans` |
| Fallback | `Segoe UI`, system sans |
| Base size | ~14sp body |
| Weights | 400 regular, 500 medium, 600 semi, 700 bold |
| Section labels | uppercase, ~11–12sp, letter-spacing ~0.06em, color `muted` |

Flutter:

```yaml
# pubspec — google_fonts
google_fonts: ^6.x
```

```dart
ThemeData(
  fontFamily: GoogleFonts.dmSans().fontFamily,
  colorScheme: ColorScheme.light(
    primary: Color(0xFF0F3D26),
    onPrimary: Colors.white,
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF15261D),
    error: Color(0xFFB91C1C),
  ),
  scaffoldBackgroundColor: Color(0xFFEEF5F0),
);
```

### Shape & spacing

| Element | Spec |
|---------|------|
| Card radius | **14** |
| Modal / large card | **16** |
| Hero / banner | **18** |
| Buttons / chips / pills | **stadium / 999** (fully rounded) |
| Inputs | radius ~**10–12**, border `#D9E5DD`, fill `#F8FAFB` or white |
| Input focus | border `#2F7D52` |
| Page padding | ~12–16 |
| Card shadow | soft green-tinted: `0 1px 2px rgba(15,61,38,0.03)` or light elevation |

### Components to mirror

| Web | Flutter |
|-----|---------|
| Dark green **sidebar** + white main | `NavigationRail` / drawer `#0F3D26`, content mint |
| Pill **primary** CTA | `ElevatedButton` stadium + green gradient |
| Pill **secondary** | white fill, `#D9E5DD` border, text `#15261D` |
| Status **badges** | small rounded chips with status colors above |
| Auth split (logo left / form right) | green panel + mint panel; round logo |
| Footer | `Powered by MNFSR` muted, primary on **MNFSR** |
| Logo | `/mnfsr-logo.jpg` (circular crop) |

### Auth screens

- Left: dark green gradient, ministry title, round **MNFSR logo** (fixed **300×300** desktop look; mobile ~220)
- Right: mint `#E8F5E9` / `#EEF5F0`, white card form
- Primary CTA full width, dark green

### Do / don’t

- **Do** keep forest green + mint identity.
- **Don’t** use purple/indigo “AI default” themes, neon glows, or cream/terracotta palettes.
- Prefer light mode (web is light).

### Suggested `AppColors` class

```dart
class AppColors {
  static const primary = Color(0xFF0F3D26);
  static const primaryDark = Color(0xFF0A2E1C);
  static const primaryMid = Color(0xFF1B5E3B);
  static const primarySoft = Color(0xFF2F7D52);
  static const mint = Color(0xFFEEF5F0);
  static const mintDeep = Color(0xFFE1EBE4);
  static const card = Color(0xFFFFFFFF);
  static const border = Color(0xFFD9E5DD);
  static const text = Color(0xFF15261D);
  static const muted = Color(0xFF6B7C72);
  static const danger = Color(0xFFB91C1C);
  static const open = Color(0xFFD97706);
  static const inProgress = Color(0xFF2563EB);
  static const resolved = Color(0xFF16A34A);
  static const openBg = Color(0xFFFFF7ED);
  static const progressBg = Color(0xFFEFF6FF);
  static const resolvedBg = Color(0xFFECFDF5);
}
```

---

## 1. Response envelope

Every JSON API returns this envelope (except raw file downloads).

### Success

```json
{
  "success": true,
  "data": { }
}
```

HTTP status: usually `200`, create endpoints often `201`.

### Failure

```json
{
  "success": false,
  "message": "Human readable error",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Valid email is required"]
    }
  }
}
```

`errors` is only present on validation failures (Zod).

### Flutter parsing tip

```dart
if (json['success'] == true) {
  final data = json['data'];
} else {
  throw ApiException(json['message'] as String, statusCode);
}
```

---

## 2. Authentication

### Header (all protected routes)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Rules

1. Store `token` + `user` after login (secure storage recommended).
2. Send Bearer token on every authenticated call.
3. On `401`, clear session and go to login.
4. Login is blocked until admin **approves** a self-signup citizen (`PENDING` / `REJECTED`).
5. JWT is only valid for users with `approvalStatus = APPROVED`.

### Roles

| Role | Meaning | Typical home screen |
|------|---------|---------------------|
| `USER` | Citizen | My complaints / profile |
| `ADMIN` | System admin | All complaints / users |
| `DEPARTMENT_HEAD` | HOD | Assigned complaints |

### Enums

```text
Role:            USER | ADMIN | DEPARTMENT_HEAD
ApprovalStatus:  PENDING | APPROVED | REJECTED
ComplaintStatus: OPEN | IN_PROGRESS | RESOLVED
```

### Complaint lifecycle

```text
OPEN  →  (admin forwards to HOD)  →  IN_PROGRESS  →  (HOD resolves)  →  RESOLVED
```

- Citizens never see internal comments.
- Citizens only see `finalResolution` when status is `RESOLVED`.
- Admin / HOD see full `comments[]` (including `isFinalResolution`).

---

## 3. Shared models

### AuthUser (login + `/api/users/me`)

```json
{
  "id": "clx...",
  "name": "Ahmed Khan",
  "email": "ahmed.khan@example.com",
  "role": "USER",
  "approvalStatus": "APPROVED",
  "phone": "+92-300-5551234",
  "address": "North Block A, Islamabad",
  "cnic": "61101-1234567-1",
  "city": "Islamabad",
  "district": "Islamabad",
  "province": "Islamabad Capital Territory",
  "gender": "Male",
  "dateOfBirth": "1990-05-12",
  "alternatePhone": null,
  "occupation": "Shopkeeper",
  "profileCompleted": true,
  "createdAt": "2026-09-04T11:00:00.000Z",
  "updatedAt": "2026-09-04T12:00:00.000Z",
  "homeDepartmentId": "clxdept...",
  "homeDepartment": { "id": "clxdept...", "name": "Public Works" },
  "otherDepartmentNote": null,
  "managedDepartments": []
}
```

Notes:

- `dateOfBirth` is `YYYY-MM-DD` or `null` (not always full ISO).
- `gender`: `"Male" | "Female" | "Other" | "Prefer not to say"` or `null`.
- HOD: `managedDepartments` is a list of `{ id, name }`.
- Citizen profile is **complete** when these are all non-empty: `name`, `phone`, `address`, `cnic`, `city`, `district`, `province`.

### Department

```json
{ "id": "clx...", "name": "Public Works", "createdAt": "2026-09-04T11:00:00.000Z" }
```

Public list may omit `createdAt`.

### Attachment

```json
{
  "id": "clx...",
  "complaintId": "clx...",
  "fileUrl": "/api/uploads/complaints/clx.../uuid.pdf",
  "fileType": "application/pdf",
  "uploadedAt": "2026-09-04T11:00:00.000Z"
}
```

Display URL: `BASE_URL + fileUrl`  
Example: `http://localhost:3000/api/uploads/complaints/.../file.pdf`

Upload rules (create complaint):

- Field name: `attachments` (multiple)
- Types: jpeg, jpg, png, webp, gif, pdf
- Max **5MB** per file

### Complaint — citizen list (`GET /api/complaints`)

```json
{
  "id": "clx...",
  "userId": "clx...",
  "departmentId": "clx...",
  "title": "Broken streetlight",
  "description": "...",
  "status": "OPEN",
  "assignedDeptHeadId": null,
  "createdAt": "2026-09-04T11:00:00.000Z",
  "updatedAt": "2026-09-04T11:00:00.000Z",
  "department": { "id": "clx...", "name": "Public Works" },
  "attachments": []
}
```

### Complaint — citizen detail / create response

Same as list, plus:

```json
{
  "user": {
    "id": "clx...",
    "name": "Ahmed Khan",
    "email": "ahmed.khan@example.com",
    "role": "USER",
    "phone": "+92-300-5551234",
    "homeDepartmentId": "clx...",
    "homeDepartment": { "id": "clx...", "name": "Public Works" }
  },
  "finalResolution": null
}
```

When resolved:

```json
"finalResolution": {
  "id": "clx...",
  "comment": "Spray completed on schedule.",
  "createdAt": "2026-09-04T15:00:00.000Z"
}
```

**No** `comments` array for citizens.

### Complaint — admin / HOD shape

```json
{
  "id": "clx...",
  "userId": "clx...",
  "departmentId": "clx...",
  "title": "Uneven water supply",
  "description": "...",
  "status": "IN_PROGRESS",
  "assignedDeptHeadId": "clxhod...",
  "createdAt": "2026-09-04T11:00:00.000Z",
  "updatedAt": "2026-09-04T12:00:00.000Z",
  "department": { "id": "clx...", "name": "Water & Sanitation" },
  "attachments": [],
  "assignedDeptHead": {
    "id": "clxhod...",
    "name": "Imran Malik",
    "email": "hod.works@cms.local",
    "role": "DEPARTMENT_HEAD"
  },
  "user": {
    "id": "clx...",
    "name": "Aisha Bibi",
    "email": "aisha.bibi@example.com",
    "role": "USER",
    "phone": "+92-333-7778899",
    "homeDepartmentId": "clx...",
    "homeDepartment": { "id": "clx...", "name": "Water & Sanitation" }
  },
  "comments": [
    {
      "id": "clx...",
      "complaintId": "clx...",
      "commentedBy": "clxadmin...",
      "comment": "Please inspect this week.",
      "isFinalResolution": false,
      "createdAt": "2026-09-04T12:00:00.000Z",
      "author": {
        "id": "clxadmin...",
        "name": "System Admin",
        "email": "admin@cms.local",
        "role": "ADMIN"
      }
    }
  ]
}
```

---

## 4. App flows (build screens from these)

### A) Citizen (USER)

```text
1. GET  /api/departments/public          → signup department dropdown
2. POST /api/auth/signup                 → PENDING (no token)
3. Wait for admin approve
4. POST /api/auth/login                  → token + user
5. If profile incomplete → Profile screen
6. PUT  /api/users/me                    → complete profile
7. GET  /api/complaints                  → list
8. POST /api/complaints  (multipart)     → file (only after profile + home dept)
9. GET  /api/complaints/:id              → detail + finalResolution
10. GET /api/reports/complaints          → own reports (optional filters)
11. POST /api/users/me/password          → change password (logged in)
```

### B) Admin

```text
1. POST /api/auth/login
2. GET  /api/admin/complaints            → overview / filters
3. GET  /api/admin/complaints/:id
4. PUT  /api/admin/complaints/:id/forward
5. POST /api/admin/complaints/:id/comments
6. GET  /api/admin/users?approvalStatus=PENDING
7. POST /api/admin/users/:id/approve | reject
8. CRUD departments + users + HODs
9. GET  /api/reports/complaints          → all data
```

### C) HOD (DEPARTMENT_HEAD)

```text
1. POST /api/auth/login                  → managedDepartments on user
2. GET  /api/depthead/complaints         → assigned only
3. GET  /api/depthead/complaints/:id
4. POST /api/depthead/complaints/:id/comments
5. PUT  /api/depthead/complaints/:id/resolve
6. GET  /api/reports/complaints          → managed departments scope
```

---

## 5. Auth APIs

### `POST /api/auth/login`

**Auth:** none

**Request**

```json
{
  "email": "admin@cms.local",
  "password": "Pass@12345"
}
```

**Response `200` — `data`**

```json
{
  "token": "<JWT>",
  "user": { "...AuthUser..." }
}
```

**Errors**

| Status | message |
|--------|---------|
| 401 | `Invalid email or password` |
| 403 | `Your account is pending admin approval. You cannot sign in yet.` |
| 403 | `Your registration was rejected. Please contact an administrator.` |

---

### `POST /api/auth/signup`

**Auth:** none  
Creates `USER` with `approvalStatus: PENDING`. **No token returned.**

**Request (known department)**

```json
{
  "name": "Lodhi Hasnain",
  "email": "lodhi@example.com",
  "password": "Pass@12345",
  "departmentId": "clxdept..."
}
```

**Request (Other)**

```json
{
  "name": "Lodhi Hasnain",
  "email": "lodhi@example.com",
  "password": "Pass@12345",
  "otherDepartment": true,
  "otherDepartmentNote": "Livestock Extension"
}
```

**Response `201` — `data`**

```json
{
  "user": {
    "id": "clx...",
    "name": "Lodhi Hasnain",
    "email": "lodhi@example.com",
    "role": "USER",
    "approvalStatus": "PENDING",
    "homeDepartmentId": "clxdept...",
    "otherDepartmentNote": null,
    "createdAt": "2026-09-04T11:00:00.000Z"
  },
  "message": "Account created. An admin must approve your registration before you can sign in."
}
```

**Errors:** `409` email exists · `404` department not found · `400` validation

---

### `POST /api/auth/change-password`

**Auth:** none (public reset using email + current password)

**Request**

```json
{
  "email": "user@example.com",
  "oldPassword": "Pass@12345",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

**Response `200` — `data`**

```json
{
  "message": "Password updated. You can sign in with your new password."
}
```

---

## 6. Current user APIs

### `GET /api/users/me`

**Auth:** any approved role  
**Response `200` — `data`:** full AuthUser (includes `updatedAt`)

---

### `PUT /api/users/me`

**Auth:** any approved role  
Send **at least one** field.

**Request (citizen profile complete)**

```json
{
  "name": "Lodhi Hasnain",
  "phone": "+92-300-1112233",
  "address": "Street 4, Sector G-11",
  "cnic": "61101-1234567-1",
  "city": "Islamabad",
  "district": "Islamabad",
  "province": "Islamabad Capital Territory",
  "gender": "Male",
  "dateOfBirth": "1995-02-10",
  "alternatePhone": "+92-333-0001111",
  "occupation": "Student"
}
```

**Response `200` — `data`:** updated AuthUser  
For `USER`, `profileCompleted` becomes `true` only when required fields are filled.

**Errors:** `400` `Provide at least one field to update`

---

### `POST /api/users/me/password`

**Auth:** any approved role (logged in)

**Request**

```json
{
  "oldPassword": "Pass@12345",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

**Response `200` — `data`**

```json
{ "message": "Password updated successfully." }
```

---

## 7. Departments

### `GET /api/departments/public`

**Auth:** none (signup)

**Response `200` — `data`**

```json
[
  { "id": "clx1", "name": "Public Works" },
  { "id": "clx2", "name": "Water & Sanitation" }
]
```

---

### `GET /api/departments`

**Auth:** any approved role

**Response `200` — `data`**

```json
[
  { "id": "clx1", "name": "Public Works", "createdAt": "2026-09-04T11:00:00.000Z" }
]
```

---

## 8. Citizen complaints

### `GET /api/complaints`

**Auth:** `USER`  
**Response `200` — `data`:** `Complaint[]` (list shape, no comments)

---

### `POST /api/complaints`

**Auth:** `USER`  
**Content-Type:** `multipart/form-data`

| Field | Required | Notes |
|-------|----------|--------|
| `title` | yes | max 200 |
| `description` | yes | max 5000 |
| `departmentId` | yes* | Must match home department; server forces home dept |
| `attachments` | no | multiple files |

\*Always send user’s `homeDepartmentId`. Server rejects mismatch.

**Gates**

1. User must have `homeDepartmentId`
2. Profile must be complete (phone, address, CNIC, city, district, province)

**Flutter example (dio)**

```dart
final form = FormData.fromMap({
  'title': title,
  'description': description,
  'departmentId': homeDepartmentId,
  'attachments': [
    for (final f in files)
      MultipartFile.fromFileSync(f.path, filename: f.name),
  ],
});
await dio.post('$BASE_URL/api/complaints', data: form,
  options: Options(headers: {'Authorization': 'Bearer $token'}));
```

**Response `201` — `data`:** citizen detail complaint (`finalResolution` may be null)

**Errors**

| Status | message |
|--------|---------|
| 400 | `You must be assigned to a department before filing a complaint. Contact an admin.` |
| 400 | `Complete your profile before filing a complaint (phone, address, CNIC, city, district, province).` |
| 403 | `You can only file complaints for your assigned department` |
| 400 | file type / size errors |

---

### `GET /api/complaints/:id`

**Auth:** `USER` (own complaint only)  
**Response `200` — `data`:** citizen detail shape  
**Errors:** `404` `Complaint not found`

---

## 9. Admin — complaints

### `GET /api/admin/complaints`

**Auth:** `ADMIN`  
**Query (optional):** `status=OPEN|IN_PROGRESS|RESOLVED`

**Response `200` — `data`:** admin-shaped `Complaint[]`

---

### `GET /api/admin/complaints/:id`

**Auth:** `ADMIN`  
**Response `200` — `data`:** admin-shaped complaint

---

### `PUT /api/admin/complaints/:id/forward`

**Auth:** `ADMIN`  
Assigns HOD and sets status `IN_PROGRESS`.

**Request**

```json
{
  "assignedDeptHeadId": "clxhod..."
}
```

HOD must manage the complaint’s department.

**Response `200` — `data`:** updated admin complaint

**Errors:** cannot forward resolved · HOD not for that department · 404

---

### `POST /api/admin/complaints/:id/comments`

**Auth:** `ADMIN`  
Internal note (`isFinalResolution: false`). **Not visible to citizens.**

**Request**

```json
{ "comment": "Please inspect the feeder line this week." }
```

**Response `201` — `data`**

```json
{
  "id": "clx...",
  "complaintId": "clx...",
  "commentedBy": "clxadmin...",
  "comment": "Please inspect the feeder line this week.",
  "isFinalResolution": false,
  "createdAt": "2026-09-04T12:00:00.000Z",
  "author": {
    "id": "clxadmin...",
    "name": "System Admin",
    "email": "admin@cms.local",
    "role": "ADMIN"
  }
}
```

---

## 10. Admin — departments (master data)

### `POST /api/admin/departments`

**Auth:** `ADMIN`

```json
{ "name": "Food Safety" }
```

**Response `201` — `data`:** `{ id, name, createdAt }`  
**Errors:** `409` name exists

### `PUT /api/admin/departments/:id`

```json
{ "name": "Food Safety & Quality" }
```

### `DELETE /api/admin/departments/:id`

**Response `200` — `data`:** `{ "id": "...", "deleted": true }`  
**Errors:** `400` if complaints still linked

---

## 11. Admin — users

### `GET /api/admin/users`

**Auth:** `ADMIN`  
**Query (optional):**

- `role=USER|ADMIN|DEPARTMENT_HEAD`
- `approvalStatus=PENDING|APPROVED|REJECTED`

**Response `200` — `data`:** user list items including:

`id, name, email, phone, role, approvalStatus, homeDepartmentId, otherDepartmentNote, profileCompleted, createdAt, updatedAt, homeDepartment, managedDepartments`

Use `profileCompleted` for UI badges on citizens.

---

### `POST /api/admin/users`

**Auth:** `ADMIN` — creates already **APPROVED**

**Citizen**

```json
{
  "name": "New Citizen",
  "email": "citizen@example.com",
  "password": "Pass@12345",
  "role": "USER",
  "homeDepartmentId": "clxdept..."
}
```

(`profileCompleted` starts `false`)

**HOD**

```json
{
  "name": "New HOD",
  "email": "hod@example.com",
  "password": "Pass@12345",
  "role": "DEPARTMENT_HEAD",
  "departmentIds": ["clxdept1", "clxdept2"]
}
```

**Admin**

```json
{
  "name": "Second Admin",
  "email": "admin2@example.com",
  "password": "Pass@12345",
  "role": "ADMIN"
}
```

**Response `201` — `data`:** created user object

---

### `GET /api/admin/users/:id`

**Auth:** `ADMIN`  
**Response `200` — `data`:** user object

---

### `PUT /api/admin/users/:id`

**Auth:** `ADMIN`  
Optional fields: `name`, `email`, `password`, `role`, `departmentIds`, `homeDepartmentId`, `phone`, `address`

**Errors:** cannot change own role · HOD needs ≥1 department · 409 email

---

### `DELETE /api/admin/users/:id`

**Auth:** `ADMIN`  
**Response:** `{ "id": "...", "deleted": true }`  
Cannot delete self.

---

### `POST /api/admin/users/:id/approve`

**Auth:** `ADMIN` — for self-signup citizens

**Request** (empty OK if department already set)

```json
{ "homeDepartmentId": "clxdept..." }
```

Required when user selected **Other** (must assign a real department).

**Response `200` — `data`:** approved user (`approvalStatus: APPROVED`, `otherDepartmentNote` cleared)

---

### `POST /api/admin/users/:id/reject`

**Auth:** `ADMIN`  
**Body:** none  
**Response `200` — `data`:** rejected user

Cannot reject already approved users via this action.

---

### `PUT /api/admin/users/:id/password`

**Auth:** `ADMIN` — set password without old password

```json
{
  "newPassword": "Pass@12345",
  "confirmPassword": "Pass@12345"
}
```

**Response `200` — `data`**

```json
{
  "id": "clx...",
  "message": "Password updated for user@example.com"
}
```

---

## 12. Admin — department heads (legacy-friendly)

Same domain as users with `role=DEPARTMENT_HEAD`. Prefer `/api/admin/users` for unified UI; these still work.

### `GET /api/admin/department-heads`

**Auth:** `ADMIN`  
**Response `200` — `data`:** HOD list with `managedDepartments`

### `POST /api/admin/department-heads`

```json
{
  "name": "Imran Malik",
  "email": "hod.works@cms.local",
  "password": "Pass@12345",
  "departmentIds": ["clx1", "clx2"]
}
```

### `PUT /api/admin/department-heads/:id`

Optional: `name`, `email`, `password`, `departmentIds`

### `DELETE /api/admin/department-heads/:id`

**Response:** `{ "id": "...", "deleted": true }`

---

## 13. HOD APIs

### `GET /api/depthead/complaints`

**Auth:** `DEPARTMENT_HEAD`  
Only complaints where `assignedDeptHeadId` = current user.  
**Response `200` — `data`:** admin-shaped `Complaint[]`

---

### `GET /api/depthead/complaints/:id`

**Auth:** `DEPARTMENT_HEAD` (must be assignee)  
**Response `200` — `data`:** admin-shaped complaint

---

### `POST /api/depthead/complaints/:id/comments`

**Auth:** `DEPARTMENT_HEAD` (assignee)  
Internal comment (not shown to citizen).

```json
{ "comment": "Team scheduled for site visit tomorrow." }
```

**Response `201` — `data`:** comment + `author`, `isFinalResolution: false`

---

### `PUT /api/depthead/complaints/:id/resolve`

**Auth:** `DEPARTMENT_HEAD` (assignee)  
Sets status `RESOLVED` and creates final resolution comment.

```json
{
  "comment": "Issue fixed. Line repaired and pressure restored."
}
```

**Response `200` — `data`:** updated admin-shaped complaint  
**Errors:** `400` already resolved · `404` not found / not assigned

Citizen then sees this text as `finalResolution.comment`.

---

## 14. Reports

### `GET /api/reports/complaints`

**Auth:** any approved role

**Query params (all optional)**

| Param | Format | Description |
|-------|--------|-------------|
| `status` | `OPEN` \| `IN_PROGRESS` \| `RESOLVED` | |
| `departmentId` | cuid | Admin: any; HOD: only managed; User: ignored |
| `from` | `YYYY-MM-DD` | Inclusive start (UTC day) |
| `to` | `YYYY-MM-DD` | Inclusive end (UTC day) |

Example:

```http
GET /api/reports/complaints?status=OPEN&from=2026-09-01&to=2026-09-30
Authorization: Bearer ...
```

**Response `200` — `data`**

```json
{
  "items": [ "...complaint list include (no comments)..." ],
  "total": 12,
  "scopeLabel": "all",
  "role": "ADMIN",
  "departments": [
    { "id": "clx1", "name": "Public Works" }
  ]
}
```

**Scope**

| Role | Data |
|------|------|
| `ADMIN` | All complaints; `departments` = all for filter UI |
| `DEPARTMENT_HEAD` | Complaints in managed departments (or assigned-only fallback) |
| `USER` | Own complaints only; `departments` = `[]` |

CSV/PDF generation is **client-side** in the web app; Flutter should use this JSON and export locally (or share/print).

---

## 15. File download

### `GET /api/uploads/...`

**Auth:** none  
**Response:** raw bytes (not JSON envelope)  
Use `fileUrl` from attachment as path after `BASE_URL`.

```dart
final url = '$BASE_URL${attachment.fileUrl}';
// Image.network(url) or download
```

**Errors:** JSON `404` `File not found` if missing

---

## 16. HTTP status cheat sheet

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation / business rule |
| 401 | Missing/invalid token or not APPROVED |
| 403 | Wrong role / login blocked / department mismatch |
| 404 | Not found |
| 409 | Conflict (email / department name) |
| 500 | Server error |

---

## 17. Suggested Flutter modules

| Module | Endpoints |
|--------|-----------|
| `AuthRepository` | login, signup, change-password |
| `UserRepository` | me GET/PUT, me/password |
| `DepartmentRepository` | public + authenticated list |
| `ComplaintRepository` (USER) | list, create multipart, detail |
| `AdminComplaintRepository` | list, detail, forward, comments |
| `AdminUserRepository` | users CRUD, approve, reject, set password |
| `AdminDepartmentRepository` | department CRUD |
| `HodComplaintRepository` | list, detail, comments, resolve |
| `ReportRepository` | reports/complaints |
| `SessionStore` | token + user + role routing |

### Role routing after login

```text
ADMIN            → AdminDashboard
DEPARTMENT_HEAD  → HodQueue
USER             → if !profileComplete → ProfileComplete else MyComplaints
```

Citizen `profileComplete` check (client-side mirror of server):

```dart
bool get isProfileComplete =>
  (name?.trim().isNotEmpty ?? false) &&
  (phone?.trim().isNotEmpty ?? false) &&
  (address?.trim().isNotEmpty ?? false) &&
  (cnic?.trim().isNotEmpty ?? false) &&
  (city?.trim().isNotEmpty ?? false) &&
  (district?.trim().isNotEmpty ?? false) &&
  (province?.trim().isNotEmpty ?? false);
```

Or simply use `user.profileCompleted` after `GET /users/me`.

---

## 18. Demo seed accounts (after `npm run db:seed`)

Default shared password unless env overrides: **`Pass@12345`**

| Role | Email |
|------|--------|
| Admin | `admin@cms.local` |
| Admin 2 | `admin2@cms.local` |
| HOD | `hod.works@cms.local` |
| HOD | `hod.agri@cms.local` |
| User | `ahmed.khan@example.com` |
| User | `aisha.bibi@example.com` |
| User | `bilal.hussain@example.com` |

---

## 19. Environment for backend (reference)

Flutter does not need these; backend `.env`:

```env
DATABASE_URL="mysql://..."
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
APP_URL="http://localhost:3000"
```

Backend setup:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 20. Quick endpoint index

| Method | Path | Role |
|--------|------|------|
| POST | `/api/auth/login` | public |
| POST | `/api/auth/signup` | public |
| POST | `/api/auth/change-password` | public |
| GET/PUT | `/api/users/me` | any |
| POST | `/api/users/me/password` | any |
| GET | `/api/departments` | any |
| GET | `/api/departments/public` | public |
| GET/POST | `/api/complaints` | USER |
| GET | `/api/complaints/:id` | USER |
| GET | `/api/admin/complaints` | ADMIN |
| GET | `/api/admin/complaints/:id` | ADMIN |
| PUT | `/api/admin/complaints/:id/forward` | ADMIN |
| POST | `/api/admin/complaints/:id/comments` | ADMIN |
| POST/PUT/DELETE | `/api/admin/departments` (+ `/:id`) | ADMIN |
| GET/POST | `/api/admin/users` | ADMIN |
| GET/PUT/DELETE | `/api/admin/users/:id` | ADMIN |
| POST | `/api/admin/users/:id/approve` | ADMIN |
| POST | `/api/admin/users/:id/reject` | ADMIN |
| PUT | `/api/admin/users/:id/password` | ADMIN |
| GET/POST | `/api/admin/department-heads` | ADMIN |
| PUT/DELETE | `/api/admin/department-heads/:id` | ADMIN |
| GET | `/api/depthead/complaints` | HOD |
| GET | `/api/depthead/complaints/:id` | HOD |
| POST | `/api/depthead/complaints/:id/comments` | HOD |
| PUT | `/api/depthead/complaints/:id/resolve` | HOD |
| GET | `/api/reports/complaints` | any |
| GET | `/api/uploads/...` | public file |

---

*Document generated for Flutter integration against the MNFSR Complaints Portal Next.js API.*

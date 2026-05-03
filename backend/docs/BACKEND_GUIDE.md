# ItemRecovery Backend — Complete Guide (Beginner-Friendly)

This document explains **what the backend does**, **how the pieces fit together**, and **how data moves through the system**. It is written for readers who may be new to Django or REST APIs.

---

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [Ideas you should know first](#2-ideas-you-should-know-first)
3. [Tech stack](#3-tech-stack)
4. [Folder structure](#4-folder-structure)
5. [Setting up and running](#5-setting-up-and-running)
6. [Environment variables](#6-environment-variables)
7. [The database model (what is stored)](#7-the-database-model-what-is-stored)
8. [Users and roles](#8-users-and-roles)
9. [The API (all endpoints)](#9-the-api-all-endpoints)
10. [Main workflows (step by step)](#10-main-workflows-step-by-step)
11. [How matching works](#11-how-matching-works)
12. [Notifications](#12-notifications)
13. [Permissions (who can do what)](#13-permissions-who-can-do-what)
14. [File uploads (images)](#14-file-uploads-images)
15. [Django Admin](#15-django-admin)
16. [Automated tests](#16-automated-tests)
17. [Troubleshooting (beginners)](#17-troubleshooting-beginners)
18. [Glossary](#18-glossary)

---

## 1. What is this project?

This backend powers a **digital lost-and-found system** for an institution (for example a university).

It lets people:

- **Register and log in**
- **Report lost items** (what was lost, where, when, category, colour, optional photo)
- **Report found items** (what was found, where, when, optional photo)
- **Automatically suggest matches** between lost and found reports (a simple scoring system)
- **Submit a claim** when someone believes a match is their lost item
- **Staff review** claims (approve or reject)
- **See in-app notifications** when something important happens (e.g. new matches, claim decisions)

The “brain” of the logic lives on the **server** (this Django project). A separate **frontend** or **mobile app** would talk to it using HTTP requests (the **API**).

---

## 2. Ideas you should know first

| Term | Simple meaning |
|------|----------------|
| **Backend** | The server program that stores data and enforces rules. |
| **API** | A set of URLs you call with HTTP (GET, POST, etc.) to send/receive **JSON** (text data). |
| **REST** | A common style of designing APIs (resources like `/api/items/lost/`, `/api/claims/`). |
| **Django** | A Python web framework: handles URLs, database, admin, security. |
| **Django REST Framework (DRF)** | Adds tools to build a **JSON API** on top of Django. |
| **ORM** | Lets you read/write the database using Python classes (`LostItem`, `User`) instead of raw SQL. |
| **Migration** | Files that describe database table changes; `migrate` applies them. |
| **Authentication** | Proving who you are (e.g. username + password). |
| **Session** | Server remembers you via a **cookie** after login. |
| **Basic Auth** | Username and password sent in a header on **each** request (handy for tools like Postman). |

---

## 3. Tech stack

| Piece | Role |
|-------|------|
| **Python** | Language the server runs on. |
| **Django** | Web framework and ORM. |
| **Django REST Framework** | JSON API (serializers, viewsets). |
| **PostgreSQL** | Database (configured via environment variables). |
| **django-cors-headers** | Allows browsers on other origins (e.g. Next.js on port 3000) to call the API (browsers only; tools like Postman ignore CORS). |
| **django-environ** | Loads settings from a `.env` file. |
| **Gunicorn / Uvicorn** | Used to run the app in production (not required for `runserver`). |

Dependencies are listed in `requirements.txt` at the backend root.

---

## 4. Folder structure

Everything below is under the **`backend/`** directory (where `manage.py` lives).

| Path | Purpose |
|------|---------|
| `manage.py` | Django command-line entry point (`runserver`, `migrate`, `test`, …). |
| `config/` | Project settings: `settings.py`, root `urls.py`, WSGI. |
| `users/` | Custom user model, registration, login/logout, user API. |
| `items/` | Lost items and found items (models, API, admin). |
| `matches/` | Match records + scoring + `recompute` API. |
| `claims/` | Claims on a match + staff **verify** API. |
| `notifications/` | In-app notification model + API + helpers used by other apps. |
| `media/` | Uploaded files (images); created at runtime; usually gitignored. |
| `docs/` | Documentation (this guide). |

Each app typically contains:

- `models.py` — database tables as Python classes  
- `views.py` — code that handles HTTP requests  
- `serializers.py` — converts models ↔ JSON  
- `urls.py` — attaches URLs to views  
- `admin.py` — Django admin registration  
- `migrations/` — database history  
- `tests.py` — automated tests  

---

## 5. Setting up and running

**Prerequisites:** Python 3.x, PostgreSQL running, a virtual environment recommended.

1. **Create and activate a virtual environment** (optional but good practice).

2. **Install packages** (from the `backend` folder):

   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env`** in the `backend` folder (see [Environment variables](#6-environment-variables)).

4. **Apply migrations** (creates/updates tables):

   ```bash
   python manage.py migrate
   ```

5. **Create an admin user** (for `/admin/` and staff actions):

   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**

   ```bash
   python manage.py runserver
   ```

   Default address: `http://127.0.0.1:8000/`

7. **Run tests** (optional):

   ```bash
   python manage.py test
   ```

---

## 6. Environment variables

These are read from **`backend/.env`** (via `django-environ`). Names must match what `config/settings.py` expects.

| Variable | Meaning |
|----------|---------|
| `SECRET_KEY` | Django secret; keep private in production. |
| `DEBUG` | `True` for local dev; `False` in production. |
| `ALLOWED_HOSTS` | Comma-separated hostnames allowed to serve the site. |
| `DB_NAME` | PostgreSQL database name. |
| `DB_USER` | Database user. |
| `DB_PASSWORD` | Database password. |
| `DB_HOST` | Default often `127.0.0.1`. |
| `DB_PORT` | Default often `5432`. |

**Example `.env` shape** (values are yours to choose):

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=itemrecovery
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=5432
```

---

## 7. The database model (what is stored)

Think of the database as **tables** linked by **foreign keys** (pointers to rows in other tables).

### 7.1 Entity relationship (conceptual)

```text
User
  ├── LostItem[]        (items this user reported as lost)
  ├── FoundItem[]       (items this user reported as found)
  ├── ItemClaim[]       (claims they submitted)
  └── Notification[]    (messages shown to them in the app)

LostItem  ──┐
            ├── ItemMatch  (links one lost + one found, score + status)
FoundItem ──┘

ItemMatch ── ItemClaim[]   (someone can claim a specific match)
```

### 7.2 Main models (short descriptions)

| Model | App | What it stores |
|-------|-----|----------------|
| **User** | `users` | Login identity, email, role (`student` / `staff` / `admin` in data), optional profile fields, `is_staff` for Django staff powers. |
| **LostItem** | `items` | One lost report: title, description, category, colour, date lost, location, status (`active` / `resolved`), optional image. |
| **FoundItem** | `items` | One found report: similar fields, date found, status (`unclaimed` / `claimed`). |
| **ItemMatch** | `matches` | One pair (lost + found) with `match_score` (0–100) and status (`pending` / `verified` / `claimed`). |
| **ItemClaim** | `claims` | Someone (the **lost-item reporter**) claims a match; status `pending` / `approved` / `rejected`; staff verification fields. |
| **Notification** | `notifications` | A short message for a user, read/unread flag. |

**Unique rule:** There is at most **one** `ItemMatch` row per (`lost_item`, `found_item`) pair.

---

## 8. Users and roles

- **`role` field** (`student`, `staff`, `admin`): useful for your **business logic** and reports; it is **custom** on the user model.
- **`is_staff`**: Django’s flag. Users with `is_staff=True` can:
  - Use **staff-only** API behaviour (e.g. **verify claims**, **list all users**).
  - Log into **`/admin/`** if they also have appropriate permissions (superuser has full admin).

For the **claim verification** endpoint, the code checks **`is_staff`**, not the string `role`.

---

## 9. The API (all endpoints)

**Base path:** all routes below are prefixed with **`/api/`** on your server.

Example: `http://127.0.0.1:8000/api/users/me/`

**Authentication:** Most endpoints require a logged-in user. The API supports:

1. **Session** — login with `POST /api/auth/login/`; browser sends `sessionid` cookie.  
2. **HTTP Basic Auth** — send `Authorization: Basic ...` on every request (easy in Postman).

Unless noted, **body** is **JSON** with header `Content-Type: application/json`.

---

### 9.1 Users (`users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users/` | No | Register a new account. |
| GET | `/users/me/` | Yes | Current user’s profile. |
| GET | `/users/` | Staff | List all users. |
| GET / PUT / PATCH / DELETE | `/users/{id}/` | Yes | Per rules in code (typically own profile; staff broader). |
| POST | `/auth/login/` | No | Body: `username`, `password`. Starts a **session** (cookie). |
| POST | `/auth/logout/` | Yes | Ends session. |

**DRF browsable login (browser):** `/api-auth/login/` — useful for trying the API in a browser.

---

### 9.2 Items (`items`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/items/lost/` | Yes | List lost items. Query: `?status=`, `?category=`. |
| POST | `/items/lost/` | Yes | Create lost report (JSON or multipart with file). |
| GET / PUT / PATCH / DELETE | `/items/lost/{id}/` | Yes | Retrieve/update/delete. **Owner or staff** for changes. |
| GET | `/items/found/` | Yes | List found items. Same query params. |
| POST | `/items/found/` | Yes | Create found report. |
| GET / PUT / PATCH / DELETE | `/items/found/{id}/` | Yes | Same permission idea as lost. |

---

### 9.3 Matches (`matches`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches/` | Yes | List matches. Query: `?lost_id=`, `?found_id=`. Non-staff only see matches where they reported the **lost** or **found** side. |
| GET | `/matches/{id}/` | Yes | One match detail. |
| POST | `/matches/recompute/` | Yes | **Lost-item owner or staff.** Rebuilds matches for one lost item. Body: `{"lost_item": <id>}` or query `?lost_id=<id>`. |

---

### 9.4 Claims (`claims`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/claims/` | Yes | Create claim. Body: `{"match": <id>}`. **Only the person who reported the lost item.** |
| GET | `/claims/` | Yes | List: own claims; **staff** see all. Query: `?status=`. |
| GET | `/claims/{id}/` | Yes | **Claimant or staff.** |
| POST | `/claims/{id}/verify/` | **Staff** | Body: `{"decision": "approved"}` or `"rejected"`. |

---

### 9.5 Notifications (`notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/` | Yes | Your notifications only. Query: `?unread=true` (also `1` / `yes`). |
| GET | `/notifications/{id}/` | Yes | One notification (yours). |
| PATCH | `/notifications/{id}/` | Yes | e.g. `{"is_read": true}`. |

---

### 9.6 Other URLs

| Path | Purpose |
|------|---------|
| `/admin/` | Django admin site. |
| `/media/...` | Served in **DEBUG** mode: uploaded images. |

---

## 10. Main workflows (step by step)

### Workflow A — From “lost item” to “resolved” (happy path)

1. **Alice** registers: `POST /api/users/`.  
2. **Alice** logs in (session) or uses Basic Auth.  
3. **Alice** reports a lost item: `POST /api/items/lost/`. Note the **`lost` id** (e.g. `5`).  
4. **Bob** registers and reports a found item: `POST /api/items/found/`. Note the **`found` id**.  
5. **Alice** (or staff) runs **`POST /api/matches/recompute/`** with `lost_item: 5`.  
   - The server deletes old `ItemMatch` rows for that lost item and creates new ones for every **unclaimed** found item that scores **≥ 40**.  
6. **Alice** lists matches: `GET /api/matches/?lost_id=5`, picks a **`match` id**.  
7. **Alice** creates a claim: `POST /api/claims/` with `{"match": <match_id>}`.  
   - All **`is_staff`** users get a **notification** about a pending claim.  
8. **Staff** lists claims: `GET /api/claims/?status=pending`.  
9. **Staff** verifies: `POST /api/claims/{claim_id}/verify/` with `{"decision": "approved"}`.  
   - **Claim** → approved; **ItemMatch** → `claimed`; **FoundItem** → `claimed`; **LostItem** → `resolved`.  
   - **Notifications** go to **Alice** (claimant) and **Bob** (finder).  
10. Users refresh **notifications**: `GET /api/notifications/`, mark read with **PATCH** if desired.

### Workflow B — Claim rejected

Steps 1–7 same as above. Staff sends `{"decision": "rejected"}`.

- Claim becomes **rejected**.  
- **Match** and **items** stay as they were (match still **pending**, found still **unclaimed**, lost still **active** unless changed elsewhere).  
- **Alice** gets a notification that the claim was rejected.

### Workflow C — Only matching, no claim

Steps 1–6: after **recompute**, if at least one match exists, **Alice** may get a notification like “X potential match(es) found…”. She can inspect `GET /api/matches/?lost_id=...` without filing a claim yet.

---

## 11. How matching works

Matching is **rule-based**, not machine learning.

For each pair (**lost**, **found**), the server computes a **score from 0 to 100**:

| Rule | Points |
|------|--------|
| Same category (case-insensitive, trimmed) | +40 |
| Same colour (case-insensitive, trimmed) | +30 |
| Same location string (case-insensitive, trimmed) | +20 |
| Dates: `date_found` and `date_lost` within **7 days** of each other | +10 |

The total is capped at **100**.

**Stored matches:** When you call **`recompute`**, the server only **creates** `ItemMatch` rows if the score is **≥ 40**.

**Important:** `recompute` **removes** all existing `ItemMatch` rows for that lost item first, then recreates from current data. So it is a **full refresh** for that lost item, not a merge.

---

## 12. Notifications

Notifications are **simple rows**: who receives them, the message text, and `is_read`.

They are created in code when:

| Event | Who gets notified |
|-------|-------------------|
| After **recompute** with at least one new match | The user who reported the **lost** item |
| New **claim** created | Every user with **`is_staff=True`** |
| Claim **approved** | Claimant + the user who reported the **found** item |
| Claim **rejected** | Claimant |

There is **no email** in this project; notifications are **in-app only** via the API.

---

## 13. Permissions (who can do what)

| Action | Rule (simplified) |
|--------|-------------------|
| Register | Anyone (`POST /users/`). |
| View own profile / `me` | Authenticated user. |
| List **all** users | **Staff** only. |
| List lost/found items | Any authenticated user (institutional catalogue). |
| Edit/delete a lost or found report | **Owner** of that report **or staff**. |
| List matches | Authenticated; non-staff only see matches involving **their** lost or found reports. |
| **Recompute** matches | **Owner of that lost item** or **staff**. |
| Create a claim | Authenticated; must be the **lost-item reporter** for that match; validations on match/item state. |
| List claims | Own claims, or **all** if staff. |
| **Verify** claim | **Staff** (`is_staff`) only. |
| Notifications | Only **your own** rows. |

---

## 14. File uploads (images)

- Fields use **`FileField`** with allowed extensions: **jpg, jpeg, png, webp, gif** (no extra image library required).
- In **Postman**, use **form-data** and set `image` to type **File**.
- In **DEBUG**, files are stored under **`MEDIA_ROOT`** and URLs look like **`/media/...`**.

**Production note:** On some hosts, the filesystem is **ephemeral**; uploaded files may disappear on redeploy unless you use external storage (outside this guide).

---

## 15. Django Admin

- URL: **`/admin/`**
- Use a **superuser** (or staff with permissions) to:
  - Manage **users**
  - Inspect or fix **lost/found items**, **matches**, **claims**, **notifications**

The admin is **not** a replacement for your student-facing UI, but it is very useful for demos and debugging.

---

## 16. Automated tests

Tests live in each app’s **`tests.py`**. They use Django’s test runner and DRF’s **`APITestCase`** where needed.

Run:

```bash
python manage.py test
```

or limit to apps:

```bash
python manage.py test users items matches claims notifications
```

---

## 17. Troubleshooting (beginners)

| Problem | What to check |
|---------|----------------|
| `SECRET_KEY` / database errors on start | `.env` present and variables correct. |
| `403` on POST/PATCH with **session** login | **CSRF**: browsers and some clients need CSRF token + header. Easiest fix for API testing: use **HTTP Basic Auth** instead of session. |
| `401 Unauthorized` | Missing or wrong credentials; add Basic Auth or log in first. |
| CORS errors **in the browser** only | `CORS_ALLOWED_ORIGINS` in `settings.py` must include your frontend origin (e.g. `http://localhost:3000`). Postman does not use CORS. |
| Empty match list after recompute | Found item must be **`unclaimed`**; pair must score **≥ 40**; category/colour/location/dates must align with the rules. |
| Cannot verify claim | User must have **`is_staff=True`**. |

---

## 18. Glossary

| Term | Meaning |
|------|---------|
| **Endpoint** | A URL + HTTP method the API exposes. |
| **JSON** | Text format for structured data `{ "key": "value" }`. |
| **Serializer** | DRF component that validates input and turns models into JSON. |
| **ViewSet** | DRF class grouping list/detail/create/update actions for one resource. |
| **Migration** | Versioned change to the database schema. |
| **Foreign key** | A field that points to another row (e.g. `lost_item` → `LostItem`). |
| **Query parameter** | Extra part of URL: `?lost_id=5`. |

---

## Document location

This file lives at:

`backend/docs/BACKEND_GUIDE.md`

You can open it in any Markdown viewer or on GitHub/GitLab for formatted headings and tables.

---

*This guide describes the backend as built for a university project. Extend it in your own README or report if your supervisor asks for citations or diagrams.*

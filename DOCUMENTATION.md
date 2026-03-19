# Data Dictionary Web UI — Full Documentation

## Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the App](#running-the-app)
8. [Frontend Development](#frontend-development)
9. [Features](#features)
10. [User Roles & Permissions](#user-roles--permissions)
11. [API Reference](#api-reference)
12. [Deployment](#deployment)
13. [Security](#security)
14. [Troubleshooting](#troubleshooting)

---

## Overview

**Data Dictionary Web UI** is a self-hosted web application for exploring and governing your data catalog. It reads YAML-based schema definitions (e.g., dbt `schema.yml` files), presents them in a searchable browser, and enforces granular role-based access control so each user only sees what they're allowed to.

---

## Architecture

```
┌──────────────────────────────────────────┐
│            Browser (React SPA)           │
│  React 18 · React Router · Zustand       │
│  Vite build → served as static files     │
└────────────────────┬─────────────────────┘
                     │ REST API (JSON)
                     │ Bearer JWT auth
┌────────────────────▼─────────────────────┐
│          Flask Backend (app.py)          │
│  Python 3.8+ · Flask · Flask-Login       │
│  PyJWT · SQLite · YAML parsing           │
└────────────────────┬─────────────────────┘
          ┌──────────┴──────────┐
          │                     │
   SQLite DB               YAML files
  (users, perms,       (schema definitions)
   groups, logs)
```

**Auth flow:** The frontend stores a JWT token in `localStorage`. Every API request sends `Authorization: Bearer <token>`. A Flask `before_request` hook decodes the token, validates its expiry and `boot_id` (see [Security](#security)), then calls `login_user()` so all `@login_required` decorators work transparently.

---

## Project Structure

```
data_dictionary_web/         # Python Package directory
├── server.py               # Flask backend — all API routes, auth, RBAC
├── config.py               # Config helpers
├── __main__.py             # CLI entry point (ddweb)
├── __init__.py             # Package init
├── exporters/              # Pluggable export format modules
│   ├── base.py             # BaseExporter abstract class
│   └── *.py                # One file per export format
├── static/
│   └── dist/               # Built React SPA (served by Flask)
├── templates/              # Legacy HTML templates (if any)
```

At the root directory:
```
├── pyproject.toml          # Python package build configuration
├── MANIFEST.in             # Ensures templates and static are packaged
├── quickstart.py           # First-run setup helper script
├── .env                    # Environment variables (never commit this)
├── .env.example            # Template for .env
├── exporters/              # Pluggable export format modules
│   ├── base.py             # BaseExporter abstract class
│   └── *.py                # One file per export format
├── frontend/               # React SPA source
│   ├── src/
│   │   ├── App.tsx         # Root component, routing, session guard
│   │   ├── store/          # Zustand state (authStore)
│   │   ├── services/       # API client (axios)
│   │   ├── pages/          # Route-level page components
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # Custom React hooks (inactivity timeout, theme)
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── static/
│   └── dist/               # Built React SPA (served by Flask)
├── templates/              # Legacy HTML templates (if any)
├── data_dictionary.db      # SQLite database (auto-created on first run)
└── dbt_models/             # Default YAML schema directory
```

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Python | 3.9 | Backend runtime and CLI tool |
| pip | 21+ | Python package manager |
| Node.js | 18 | Frontend build (dev only) |
| npm | 9+ | Frontend package manager (dev only) |

---

## Installation

### Standard Installation

Simply install the bundled application as a global or virtual Python environment package:

```bash
pip install data-dictionary-web
```

This installs both the Flask backend and the compiled React frontend, and gives you access to the `ddweb` CLI command.

### Frontend (Production Build)

The `static/dist/` directory should already contain a built frontend. If it doesn't, or if you've pulled changes:

```bash
cd frontend
npm install
npm run build
# Built files go to ../static/dist/
```

---

## Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Flask secret key — used for session cookies
SECRET_KEY=replace-with-a-long-random-string

# JWT signing secret — used to sign and verify Bearer tokens
JWT_SECRET_KEY=replace-with-a-different-long-random-string

# Path to the directory containing your YAML schema files
YAML_DIRECTORY=./dbt_models

# SQLite database path
DATABASE=./data_dictionary.db

# Flask environment (development | production)
FLASK_ENV=development
```

> **Auto-generation:** If `SECRET_KEY` or `JWT_SECRET_KEY` are missing, the app generates them automatically and saves them to `.env`. This is convenient for first runs but you should set your own keys in production.

### Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | *(auto-generated)* | Flask session secret |
| `JWT_SECRET_KEY` | *(auto-generated)* | JWT signing secret |
| `YAML_DIRECTORY` | `./models` | Path to YAML schema files |
| `DATABASE` | `./data_dictionary.db` | SQLite DB file path |
| `FLASK_ENV` | `development` | `development` enables debug mode |

---

## Running the App

### Local Execution

Use the bundled `ddweb` CLI to launch the application:

```bash
# Run with defaults (0.0.0.0:5002, ./data_dictionary.db, ./models)
ddweb

# Or specify custom config inline
ddweb --port 8080 --yaml-dir /path/to/my_dbt_models --database /path/to/catalog.db
```

The app is available at **http://localhost:5002**.

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change the admin password immediately after first login via Profile → Change Password.

### Production (Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5002 app:app
```

---

## Frontend Development

If you want to work on the React frontend with hot-reload:

```bash
# Terminal 1 — Flask API backend
python app.py

# Terminal 2 — Vite dev server (proxies API calls to Flask)
cd frontend
npm install
npm run dev
```

The Vite dev server runs on **http://localhost:5173** and proxies `/api/*` requests to the Flask backend at port 5002.

When you're done with your changes, build the production bundle:

```bash
cd frontend
npm run build
```

The built files are placed in `static/dist/` and served by Flask.

---

## Features

### 🔍 Search

- Search across all schemas, tables, and columns simultaneously.
- Results show the matching entity type (schema / table / column), parent context, description, and data type.
- Filter results by schema name or table type using the sidebar.
- Minimum 2 characters required to trigger a search.

### 🗂️ Schema Browser

- Browse all schemas accessible to the current user in a tree/list view.
- Click a schema to list its tables; click a table to view all column metadata.
- Metadata displayed: name, description, data type, tags, and any custom `meta` fields from YAML.

### 📊 Dashboard

- Summary statistics: number of accessible schemas, tables, and columns.
- Quick-access links to recently browsed tables.

### 📈 Analytics

- View recent activity across your data catalog.
- Breakdown of search queries, table views, and user actions.

### 👥 User Groups

- Create named groups (e.g., *Data Engineers*, *Analysts*).
- Assign database-level or schema-level permissions to a group.
- Add users to groups — they inherit all group permissions.
- Managed under **Admin → Groups**.

### 📁 File Management

- Upload new YAML schema files or replace existing ones directly from the UI.
- Uploaded files are stored in the configured `YAML_DIRECTORY`.
- Hot-reload: the YAML cache updates automatically on the next request.

### 📤 Exports

- Export schema metadata to one or more formats (CSV, JSON, etc.).
- Only users with the **Export** permission or **Admin** role can export.
- Exports are filtered by the user's accessible schemas (RBAC-aware).
- Export history is recorded in the `export_log` table.

### ⏱️ Session Timeout (Inactivity)

- After **10 minutes** of inactivity (no mouse movement, clicks, keystrokes, or scroll), the user is automatically signed out.
- At **1 minute remaining**, a warning modal appears with a countdown timer.
- The user can click **"Stay logged in"** to reset the timer, or **"Sign out now"** to log out immediately.
- Each new API request or UI interaction resets the idle clock.

### 🔒 Session Invalidation on Restart

- Every server startup generates a unique `boot_id` stored in the database.
- JWTs issued at login embed the current `boot_id`.
- On every request, the `boot_id` in the token is compared against the live server value.
- If they don't match (e.g., server was restarted), the request is rejected with 401 and the user must log in again.

### 🌙 Dark / Light Mode

- Toggle between dark and light themes via the sidebar or profile menu.
- Preference is persisted in `localStorage`.

---

## User Roles & Permissions

### Roles

| Role | Description |
|---|---|
| **Admin** | Full access — manages users, groups, permissions, and all data |
| **Contributor** | Reads data in assigned schemas; can manage groups (not users) |
| **Viewer** | Read-only access to assigned schemas and tables |

### Permission Matrix

| Action | Admin | Contributor | Viewer |
|---|---|---|---|
| View assigned schemas/tables | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ (if granted) | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Create/manage groups | ✅ | ✅ | ❌ |
| Grant permissions | ✅ | ❌ | ❌ |
| Upload YAML files | ✅ | ❌ | ❌ |
| Change YAML directory | ✅ | ❌ | ❌ |
| View activity logs | ✅ | ❌ | ❌ |

### Permission Levels

Permissions can be granted at two granularities:

```
Database/Schema level:  resource_type="database", resource_name="production"
                         → grants access to ALL tables in that schema
```

### Granting Permission

**Via Admin UI:** Admin → Users → select user → Permissions tab → Add Permission.

**Via SQL (emergency):**
```sql
INSERT INTO permissions (user_id, resource_type, resource_name, permission_level)
VALUES (<user_id>, 'database', 'production', 'read');
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Login — returns JWT token |
| `POST` | `/api/auth/signup` | None | Create new account |
| `POST` | `/api/auth/logout` | ✅ | Logout (clears server session) |
| `GET` | `/api/auth/me` | ✅ | Get current user info |
| `POST` | `/api/auth/change-password` | ✅ | Change password |

**Login Request:**
```json
POST /api/auth/login
{ "username": "admin", "password": "admin123" }
```

**Login Response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": 1, "username": "admin", "role": "admin", "can_export": true }
}
```

### Search & Browse

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/search?q=<query>` | ✅ | Full-text search. Optional: `&schema=<name>`, `&table_type=<type>` |
| `GET` | `/api/schemas` | ✅ | List schemas accessible to the current user |
| `GET` | `/api/schemas/<schema>/tables` | ✅ | List tables in a schema |
| `GET` | `/api/schemas/<schema>/tables/<table>` | ✅ | Get table details and columns |
| `GET` | `/api/stats` | ✅ | Catalog statistics |

### Admin — Users

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | Admin | List all users |
| `POST` | `/api/admin/users` | Admin | Create user |
| `PUT` | `/api/admin/users/<id>` | Admin | Update user |
| `DELETE` | `/api/admin/users/<id>` | Admin | Delete user |
| `GET` | `/api/admin/users/<id>/permissions` | Admin | Get user permissions |
| `POST` | `/api/admin/users/<id>/permissions` | Admin | Grant permission |
| `DELETE` | `/api/admin/permissions/<id>` | Admin | Revoke permission |

### Admin — Groups

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/groups` | Admin/Contributor | List groups |
| `POST` | `/api/groups` | Admin | Create group |
| `PUT` | `/api/groups/<id>` | Admin | Update group |
| `DELETE` | `/api/groups/<id>` | Admin | Delete group |
| `GET` | `/api/groups/<id>/members` | Admin | List group members |
| `POST` | `/api/groups/<id>/members` | Admin | Add user to group |
| `DELETE` | `/api/groups/<id>/members/<user_id>` | Admin | Remove user from group |
| `POST` | `/api/groups/<id>/permissions` | Admin | Grant permission to group |
| `DELETE` | `/api/groups/permissions/<id>` | Admin | Revoke group permission |

### Exports

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/export/formats` | Export perm | List available export formats |
| `POST` | `/api/export/<format>` | Export perm | Export schemas to the given format |

### File Management

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/files` | Admin | List YAML files in the directory |
| `POST` | `/api/files/upload` | Admin | Upload a YAML file |
| `DELETE` | `/api/files/<filename>` | Admin | Delete a YAML file |
| `GET` | `/api/config/yaml-directory` | Admin | Get current YAML directory path |
| `PUT` | `/api/config/yaml-directory` | Admin | Change YAML directory path |

---

## Deployment

### Gunicorn (Recommended)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5002 "data_dictionary_web.server:app"
```

Use `-w` workers equal to `(2 × CPU cores) + 1`.

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Increase upload limit if using file upload feature
    client_max_body_size 20M;
}
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml MANIFEST.in README.md ./
COPY data_dictionary_web ./data_dictionary_web
RUN pip install . gunicorn
EXPOSE 5002
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5002", "data_dictionary_web.server:app"]
```

```bash
docker build -t data-dictionary-web .
docker run -p 5002:5002 \
  -v /path/to/your/yaml:/app/dbt_models \
  -v /path/to/data:/app/data_dictionary.db \
  --env-file .env \
  data-dictionary-web
```

### systemd Service (Linux)

```ini
[Unit]
Description=Data Dictionary Web UI
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/data_dictionary_web
EnvironmentFile=/opt/data_dictionary_web/.env
ExecStart=/opt/data_dictionary_web/venv/bin/gunicorn -w 4 -b 127.0.0.1:5002 app:app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## Security

### Authentication Model

- **JWT tokens** signed with `JWT_SECRET_KEY` (HS256).
- Tokens expire after **24 hours**.
- Tokens carry a `boot_id` — a random value generated fresh on every server startup.
- On every API request, the `boot_id` in the token is checked against the live server value. A mismatch (e.g., after a restart) returns 401 and forces re-login.

### Session Timeout

- Frontend enforces a **10-minute inactivity timeout**.
- User activity (mouse, keyboard, scroll, touch) resets the idle timer.
- At 60 seconds remaining, a modal warns the user.
- On timeout, the local token is cleared and the user is redirected to `/signin`.

### Password Security

- Passwords hashed with Werkzeug's PBKDF2-SHA256.
- Minimum 8 characters enforced on signup and password change.

### Production Checklist

- [ ] Set strong, unique `SECRET_KEY` and `JWT_SECRET_KEY` in `.env`
- [ ] Change the default `admin` password immediately
- [ ] Enable HTTPS via Nginx + Let's Encrypt
- [ ] Restrict CORS origins in `app.py` (`CORS(app, origins=[...])`)
- [ ] Run as a non-root user
- [ ] Keep Python dependencies updated (`pip list --outdated`)
- [ ] Back up `data_dictionary.db` and your YAML directory regularly

---

## Troubleshooting

### "No schemas visible after login"

The user has no permissions assigned. An admin must grant database access:

```
Admin → Users → [select user] → Permissions → Add Permission
resource_type: database
resource_name: <your_schema_name>
permission_level: read
```

Or via SQL:
```sql
INSERT INTO permissions (user_id, resource_type, resource_name, permission_level)
VALUES (<user_id>, 'database', '<schema_name>', 'read');
```

### "YAML files not loading"

Check that `YAML_DIRECTORY` in `.env` points to the correct path, and that files end in `.yml` or `.yaml`.

```bash
# Verify path
ls $YAML_DIRECTORY/*.yml
```

You can also change the YAML directory from within the app: **Admin → Settings → YAML Directory**.

### "Port already in use"

```bash
# Find and kill the process on port 5002
# Windows:
netstat -ano | findstr :5002
taskkill /PID <pid> /F

# macOS/Linux:
lsof -ti:5002 | xargs kill -9
```

Or change the port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5003)
```

### "Frontend shows blank page"

The React build in `static/dist/` may be missing or stale. Rebuild it:

```bash
cd frontend
npm install
npm run build
```

### "Session doesn't end after restart"

Ensure you're running the latest `app.py`. The fix requires `boot_id` to be present in the JWT — tokens issued before the fix was deployed will work until they expire (24 hours). After expiry, all users must log in again to receive boot-id-bearing tokens.

### "tsc not found when building frontend"

The project's local TypeScript install may be missing. Run a clean install:

```bash
cd frontend
Remove-Item -Recurse -Force node_modules   # PowerShell
npm install
npm run build
```

---

*Documentation reflects the current state of the `ghostdev` branch.*

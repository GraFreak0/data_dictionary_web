# Data Dictionary Web — CLAUDE.md

## Project Overview

**Data Dictionary Web** is a full-stack web application for exploring, managing, and exporting data dictionaries with enterprise-grade RBAC. It is designed to be:

- **Packaged as a lightweight Python package** installable via `pip install data-dictionary-web` (or similar) into any Python environment.
- **Embeddable in Apache Airflow UI** as a plugin or iframe-based sub-application.
- **Self-contained** — the React frontend is pre-built and bundled into the Python package's static files, so end-users need only Python to run the application.

---

## Architecture

```
data_dictionary_web/
├── app.py                   # Flask API server + React SPA host
├── config.py                # Environment-aware configuration
├── exporters/               # Plugin-based export system (PDF, CSV, etc.)
│   ├── base.py              # Abstract BaseExporter
│   └── pdf_default.py       # Built-in PDF exporter
├── frontend/                # React TypeScript source (build output → static/dist)
│   ├── src/
│   │   ├── pages/           # Dashboard, Admin, Profile, Groups, SignIn, SignUp
│   │   ├── components/      # Layout (Sidebar, Layout) + UI primitives
│   │   ├── services/        # Axios API clients (auth, catalog, admin)
│   │   ├── store/           # Zustand auth store
│   │   ├── hooks/           # useTheme (light/dark)
│   │   └── types/           # Shared TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts       # Builds to ../static/dist
├── static/
│   └── dist/                # Pre-built React SPA (committed or generated at package build time)
├── templates/               # Legacy Jinja2 templates (superseded by React SPA)
├── requirements.txt
└── CLAUDE.md
```

### Frontend → Backend connection

- In **development**: Vite dev server runs on port 3000 and proxies `/api/*` to Flask on port 5001.
- In **production / packaging**: `npm run build` compiles the React app into `static/dist/`. Flask serves `static/dist/index.html` for all non-API routes (catch-all SPA handler in `app.py`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.8+, Flask 3, Flask-CORS, Flask-Login, PyJWT, Werkzeug, SQLite |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, Axios, Lucide React |
| Export | ReportLab (PDF); plugin system for additional formats |
| Auth | JWT tokens + session cookies, PBKDF2 password hashing |

---

## Pages & Routes

| Path | Page | Access |
|---|---|---|
| `/signin` | Login | Public |
| `/signup` | Registration | Public |
| `/` | Dashboard (search + catalog browser) | Authenticated |
| `/profile` | User profile + activity log | Authenticated |
| `/admin` | User & permission management | Admin only |
| `/groups` | Group management | Admin only |

---

## API Endpoints

All API routes are prefixed with `/api/`. See `app.py` for full documentation. Key groups:

- `/api/auth/*` — authentication (login, signup, logout, me, change-password)
- `/api/search`, `/api/schemas/*` — catalog browsing
- `/api/stats` — dashboard statistics
- `/api/export/*` — pluggable export system
- `/api/admin/users/*` — user management (admin)
- `/api/groups/*` — group & group-permission management (admin)

---

## Data Model (SQLite)

Tables: `users`, `user_groups`, `user_group_members`, `permissions`, `group_permissions`, `activity_log`, `export_log`

RBAC roles: `admin` (full access), `contributor` (assigned resources), `viewer` (read-only assigned resources)

---

## Export Plugin System

Drop a new file into `exporters/` that subclasses `BaseExporter` and implements `export()`. The loader auto-discovers it at startup — no changes to `app.py` needed.

```python
class MyExporter(BaseExporter):
    name = "csv"
    label = "CSV Spreadsheet"
    mime_type = "text/csv"
    extension = "csv"

    def export(self, data, user, export_type, resources) -> bytes: ...
```

---

## Environment Variables

```
SECRET_KEY=           # Flask session secret
JWT_SECRET_KEY=       # JWT signing secret
YAML_DIRECTORY=       # Path to dbt/YAML schema files
DATABASE_PATH=        # SQLite database path (default: ./data_dictionary.db)
FLASK_ENV=            # development | production
```

---

## Development Workflow

```bash
# Backend
pip install -r requirements.txt
python app.py          # Starts Flask on :5001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # Vite dev server on :3000 (proxies /api → :5001)

# Production build
cd frontend
npm run build          # Outputs to static/dist/
python app.py          # Flask serves both API + React SPA
```

---

## Python Packaging Notes

This application is intended to be distributed as a Python package so it can be:

1. **Installed anywhere**: `pip install data-dictionary-web` — no Node.js required by end-users.
2. **Run as a CLI**: `data-dictionary-web --yaml-dir ./models --port 8080`
3. **Embedded in Airflow**: Mounted as a Flask Blueprint or served via `airflow plugins` mechanism using `flask_appbuilder`.

### Packaging checklist (when preparing a release):

- [ ] Run `cd frontend && npm run build` to regenerate `static/dist/`
- [ ] Include `static/dist/` in `MANIFEST.in` / `package_data`
- [ ] Add `__main__.py` for `python -m data_dictionary_web` entry point
- [ ] Set `entry_points` in `setup.cfg` / `pyproject.toml` for CLI command
- [ ] Ensure `static/dist/` is included in the wheel (not `.gitignore`d in sdist)

### Airflow integration

Mount the Flask app as an Airflow plugin:

```python
# airflow_plugin.py
from airflow.plugins_manager import AirflowPlugin
from data_dictionary_web.app import app as dd_app
from flask import Blueprint

dd_bp = Blueprint('data_dictionary', __name__,
                  url_prefix='/data-dictionary')
# ... mount dd_app as a sub-application

class DataDictionaryPlugin(AirflowPlugin):
    name = "data_dictionary"
    flask_blueprints = [dd_bp]
```

---

## Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |

**Change immediately after first login via the Profile page.**

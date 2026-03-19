# 📚 Data Dictionary Web UI

> A modern, full-stack web application for exploring, managing, and governing your data catalog — powered by Flask, React, and YAML-based metadata.

[![Python](https://img.shields.io/badge/python-3.8+-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18+-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Smart Search** | Full-text search across schemas, tables, and columns with live filtering |
| 🔐 **RBAC** | Role-based access control — Admin, Contributor, and Viewer roles |
| 👥 **User Groups** | Group users together and assign permissions at the group level |
| 🗂️ **Schema Browser** | Browse databases, tables, and column metadata in a tree view |
| 📊 **Dashboard & Analytics** | At-a-glance stats on your data catalog and activity trends |
| 📁 **File Management** | Upload and manage YAML schema files directly from the UI |
| 📤 **Exports** | Export schema metadata to multiple formats (CSV, JSON, etc.) |
| ⏱️ **Session Timeout** | Automatic 10-minute inactivity logout with a 60-second warning |
| 🔒 **Restart Invalidation** | Server restart terminates all active sessions — no stale logins |
| 🌙 **Dark/Light Mode** | Persistent theme preference across sessions |
| 📱 **Responsive UI** | Works on desktop, tablet, and mobile |

---

## 🚀 Quick Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ (for frontend development only)

### 1. Install

Install directly via pip:

```bash
pip install data-dictionary-web
```

### 2. Configure (Optional)

By default, the app looks for YAML files in `./models` and stores the database in `./data_dictionary.db`. You can configure this via environment variables or CLI flags.

Create a `.env` file for secure configuration:

```env
SECRET_KEY=your-random-secret-key
JWT_SECRET_KEY=your-random-jwt-secret
YAML_DIRECTORY=./dbt_models
DATABASE=./data_dictionary.db
```

### 3. Run

Start the server using the bundled CLI:

```bash
ddweb
```

Or with custom options:

```bash
ddweb --port 8080 --yaml-dir ./dbt_models
```

Open **http://localhost:5002** (or your custom port) and log in with:
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change the default admin password immediately after first login.

---

## 📖 Documentation

See **[DOCUMENTATION.md](DOCUMENTATION.md)** for the full guide covering:
- Architecture & project structure
- Environment configuration
- Frontend development setup
- All features in detail
- REST API reference
- Deployment (Gunicorn, Nginx, Docker)
- Security model & best practices
- Troubleshooting

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

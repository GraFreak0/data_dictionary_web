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
- Python 3.8+
- Node.js 18+ (for frontend development only)

### 1. Clone & Install

```bash
git clone <repo-url>
cd data_dictionary_web
pip install -r requirements.txt
```

### 2. Configure

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SECRET_KEY=your-random-secret-key
JWT_SECRET_KEY=your-random-jwt-secret
YAML_DIRECTORY=./dbt_models
DATABASE=./data_dictionary.db
```

### 3. Run

```bash
python app.py
```

Open **http://localhost:5002** and log in with:
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

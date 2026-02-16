# Data Dictionary Web UI - Complete Guide

## 🎯 Overview

A modern, full-featured web application for visualizing and managing your data dictionary with:
- 🔍 **Powerful Search** - Search tables, columns, and schemas
- 🔐 **Role-Based Access Control (RBAC)** - Admin, Contributor, Viewer roles
- 👥 **User Management** - Create users and manage permissions
- 📊 **Statistics Dashboard** - Overview of your data catalog
- 🎨 **Modern UI** - Beautiful, responsive interface
- 📱 **Mobile Friendly** - Works on all devices

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [User Roles](#user-roles)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- pip
- Your YAML files from the data dictionary generator

### Step 1: Install Dependencies

```bash
cd data_dictionary_web
pip install -r requirements.txt
```

### Step 2: Configure YAML Directory

Edit `app.py` or set environment variable:

```python
# In app.py
app.config['YAML_DIRECTORY'] = './dbt_models'  # Path to your YAML files

# Or set environment variable
export YAML_DIRECTORY='/path/to/your/dbt_models'
```

### Step 3: Initialize Database

```bash
python app.py
```

This automatically creates:
- SQLite database at `./data_dictionary.db`
- Default admin user: `admin` / `admin123`

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

---

## ⚡ Quick Start

### 1. Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT:** Change the admin password after first login!

### 2. Point to Your YAML Files

Make sure your YAML files are in the directory specified in `YAML_DIRECTORY` config.

**Directory structure:**
```
dbt_models/
├── schema_production.yml
├── schema_analytics.yml
└── schema_staging.yml
```

### 3. Start Searching!

- Use the search bar to find tables, columns, or schemas
- Click on any result to see full details
- Filter by schema or table type

### 4. Create Users (Admin Only)

1. Go to Admin Panel (top right menu)
2. Click "Add User"
3. Fill in details and assign role
4. Grant permissions to specific databases/tables

---

## 👥 User Roles

### 🔴 Admin
**Full system access**

Permissions:
- ✅ View all databases, schemas, tables
- ✅ Create, edit, delete users
- ✅ Grant/revoke permissions
- ✅ Access admin panel
- ✅ View activity logs

Use cases:
- Database administrators
- Data governance team leads
- System administrators

### 🟡 Contributor
**Can view and contribute**

Permissions:
- ✅ View databases they have access to
- ✅ Search and browse
- ✅ Add descriptions/documentation (future feature)
- ❌ Cannot manage users
- ❌ Cannot grant permissions

Use cases:
- Data engineers
- Analytics engineers
- Data analysts who contribute documentation

### 🟢 Viewer
**Read-only access**

Permissions:
- ✅ View databases they have access to
- ✅ Search and browse
- ❌ Cannot edit anything
- ❌ Cannot manage users

Use cases:
- Business analysts
- Product managers
- Stakeholders who need to reference data

---

## ✨ Features

### 1. Search & Discovery

**Global Search:**
- Search across all accessible tables, columns, and schemas
- Real-time results as you type
- Results show table name, schema, column count, row count

**Filters:**
- Filter by schema/database
- Filter by table type (Table, View)

**Search Examples:**
```
customer          → Finds tables/columns with "customer"
email             → Finds all email columns
order_date        → Finds order_date columns
production        → Finds everything in production schema
```

### 2. Table Details

Click any table to see:
- Full table information
- All columns with data types
- Primary key indicators (PK badge)
- Foreign key indicators (FK badge)
- Nullable columns
- Descriptions (if available)
- Row count and metadata

### 3. User Management (Admin Only)

**Create Users:**
1. Admin Panel → Add User
2. Enter username, email, password
3. Select role (Admin, Contributor, Viewer)
4. Save

**Manage Permissions:**
1. Admin Panel → Select User
2. Click "Grant Permission"
3. Choose resource type (Database or Table)
4. Enter resource name
5. Set permission level

**Permission Examples:**
```
Resource Type: database
Resource Name: production
Level: read
→ User can access all tables in 'production' database

Resource Type: table
Resource Name: public.customers
Level: read
→ User can only access the 'customers' table in 'public' schema
```

### 4. Dashboard Statistics

View at a glance:
- Total databases accessible
- Total tables
- Total columns

Updates automatically based on user permissions.

### 5. Activity Logging

All user actions are logged:
- Logins/logouts
- Searches performed
- Tables viewed
- Permission changes
- User creation

Access logs via database query (admin only):
```sql
SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100;
```

---

## 🔌 API Reference

### Authentication

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJ...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**POST /api/auth/logout**

**GET /api/auth/me**

### Search & Browse

**GET /api/search?q={query}&schema={schema}&table_type={type}**

Parameters:
- `q` (required): Search query
- `schema` (optional): Filter by schema
- `table_type` (optional): Filter by type (BASE TABLE, VIEW)

**GET /api/schemas**

Returns list of schemas user has access to.

**GET /api/schemas/{schema}/tables**

Returns tables in a specific schema.

**GET /api/schemas/{schema}/tables/{table}**

Returns detailed table information.

**GET /api/stats**

Returns statistics (schemas, tables, columns count).

### Admin (Requires Admin Role)

**GET /api/admin/users**

Get all users.

**POST /api/admin/users**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secure123",
  "role": "viewer"
}
```

**GET /api/admin/users/{user_id}/permissions**

Get user's permissions.

**POST /api/admin/users/{user_id}/permissions**
```json
{
  "resource_type": "database",
  "resource_name": "production",
  "permission_level": "read"
}
```

**DELETE /api/admin/permissions/{permission_id}**

Revoke a permission.

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
# Secret Keys (CHANGE IN PRODUCTION!)
SECRET_KEY=your-very-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database
DATABASE_PATH=./data_dictionary.db

# YAML Files
YAML_DIRECTORY=./dbt_models

# Flask Environment
FLASK_ENV=production  # or 'development'

# CORS (if frontend is separate)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Using Configuration File

```python
# config.py is already created
# Load in app.py:

import os
from config import config

env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])
```

### Security Settings

**Production Checklist:**
- [ ] Change `SECRET_KEY`
- [ ] Change `JWT_SECRET_KEY`
- [ ] Change default admin password
- [ ] Enable HTTPS (`SESSION_COOKIE_SECURE=True`)
- [ ] Set proper CORS origins
- [ ] Use strong passwords for all users
- [ ] Regular database backups

---

## 🚢 Deployment

### Development Server

```bash
python app.py
```

Runs on `http://localhost:5000`

### Production Deployment

#### Option 1: Gunicorn (Recommended)

```bash
# Install gunicorn (already in requirements.txt)
pip install gunicorn

# Run with 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Initialize database
RUN python -c "from app import init_db; init_db()"

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

```bash
# Build
docker build -t data-dictionary-web .

# Run
docker run -p 5000:5000 \
  -v /path/to/dbt_models:/app/dbt_models \
  -v /path/to/db:/app/data \
  data-dictionary-web
```

#### Option 3: Nginx + Gunicorn

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        alias /path/to/app/static;
    }
}
```

**Systemd service (`/etc/systemd/system/data-dictionary.service`):**
```ini
[Unit]
Description=Data Dictionary Web UI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/data-dictionary
Environment="PATH=/var/www/data-dictionary/venv/bin"
ExecStart=/var/www/data-dictionary/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable data-dictionary
sudo systemctl start data-dictionary
```

---

## 🔧 Troubleshooting

### Common Issues

**1. "No YAML files found"**

```bash
# Check YAML_DIRECTORY path
echo $YAML_DIRECTORY

# Or check app.py config
grep YAML_DIRECTORY app.py

# Verify files exist
ls ./dbt_models/*.yml
```

**2. "Access Denied" for users**

```bash
# Check if user has permissions
sqlite3 data_dictionary.db "SELECT * FROM permissions WHERE user_id = 1;"

# Grant database access
# Via admin panel or SQL:
INSERT INTO permissions (user_id, resource_type, resource_name, permission_level)
VALUES (2, 'database', 'production', 'read');
```

**3. "Can't connect to server"**

```bash
# Check if Flask is running
ps aux | grep python

# Check port
netstat -an | grep 5000

# Check firewall
sudo ufw status
```

**4. Database locked errors**

```bash
# SQLite doesn't support concurrent writes
# For high traffic, consider PostgreSQL backend

# Or use WAL mode:
sqlite3 data_dictionary.db "PRAGMA journal_mode=WAL;"
```

### Debug Mode

Enable detailed error messages:

```python
# app.py
app.config['DEBUG'] = True
app.run(debug=True)
```

### Logs

Add logging:

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

---

## 📊 Database Schema

**Users Table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN
);
```

**Permissions Table:**
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resource_type TEXT NOT NULL,  -- 'database' or 'table'
    resource_name TEXT NOT NULL,  -- 'production' or 'public.customers'
    permission_level TEXT NOT NULL,  -- 'read', 'write', 'admin'
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**Activity Log Table:**
```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_name TEXT,
    timestamp TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

---

## 🎨 Customization

### Branding

**Change colors:**

Edit `templates/index.html` CSS variables:

```css
:root {
    --primary: #2563eb;  /* Change to your brand color */
    --secondary: #10b981;
    --danger: #ef4444;
}
```

**Add logo:**

```html
<!-- In sidebar-header -->
<div class="sidebar-title">
    <img src="/static/logo.png" alt="Logo" style="height: 30px;">
    Data Dictionary
</div>
```

### Custom Themes

Add dark mode toggle:

```javascript
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}
```

---

## 📚 Best Practices

1. **Security:**
   - Change default credentials immediately
   - Use strong passwords
   - Enable HTTPS in production
   - Regular security audits

2. **Performance:**
   - Use schema filters to limit search scope
   - Index SQLite database for large user bases
   - Consider caching for YAML file reads

3. **Maintenance:**
   - Regular database backups
   - Monitor activity logs
   - Update YAML files regularly
   - Review user permissions quarterly

4. **User Management:**
   - Follow principle of least privilege
   - Grant access per database/schema, not all tables
   - Remove inactive users
   - Audit permissions regularly

---

## 🆘 Support

**Common Questions:**

Q: Can I use a different database than SQLite?
A: Yes! Modify the database connection to use PostgreSQL, MySQL, etc.

Q: How do I bulk import users?
A: Create a script to read CSV and call `/api/admin/users` endpoint.

Q: Can I integrate with SSO/LDAP?
A: Yes, replace the authentication logic in `app.py` with your SSO provider.

Q: How do I back up the database?
A: `cp data_dictionary.db data_dictionary.db.backup` or use SQLite's backup API.

---

## 📝 License

MIT License - See LICENSE file

---

## 🎉 Quick Setup Checklist

- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Configure YAML_DIRECTORY in app.py
- [ ] Run `python app.py` to initialize database
- [ ] Login with admin/admin123
- [ ] Change admin password
- [ ] Create users for your team
- [ ] Grant appropriate permissions
- [ ] Start searching your data dictionary!

**You're ready to go! 🚀**

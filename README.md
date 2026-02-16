# 📚 Data Dictionary Web UI

A beautiful, modern web application for exploring and managing your data dictionary with full Role-Based Access Control (RBAC).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Features

🔍 **Powerful Search** - Search across tables, columns, and schemas with real-time results  
🔐 **RBAC** - Complete role-based access control (Admin, Contributor, Viewer)  
👥 **User Management** - Create users and manage granular permissions  
📊 **Dashboard** - Statistics and overview of your data catalog  
🎨 **Modern UI** - Beautiful, responsive interface built with modern CSS  
📱 **Mobile Friendly** - Works seamlessly on all devices  
🚀 **Fast** - Lightweight and performant  
🔒 **Secure** - JWT authentication, password hashing, session management  

---

## 🖼️ Screenshots

### Main Search Interface
Search across all your databases, schemas, and tables with powerful filters.

### Table Details View
View complete table information including columns, data types, constraints, and metadata.

### Admin Panel
Manage users and permissions with an intuitive admin interface.

---

## 🚀 Quick Start

### 1. Install

```bash
cd data_dictionary_web
pip install -r requirements.txt
```

### 2. Configure

Point to your YAML files:

```python
# In app.py, line 15
app.config['YAML_DIRECTORY'] = './dbt_models'  # Your YAML directory
```

### 3. Run

```bash
python app.py
```

### 4. Login

Open http://localhost:5000

- Username: `admin`
- Password: `admin123`

**⚠️ Change the password immediately!**

---

## 📖 Documentation

- [Complete Setup Guide](COMPLETE_GUIDE.md) - Full installation and configuration
- [API Documentation](#api-reference) - REST API endpoints
- [User Roles](#user-roles) - Understanding permissions
- [Deployment Guide](#deployment) - Production deployment instructions

---

## 👥 User Roles

| Role | View Data | Search | Manage Users | Grant Permissions |
|------|-----------|--------|--------------|-------------------|
| **Admin** | ✅ All | ✅ | ✅ | ✅ |
| **Contributor** | ✅ Assigned | ✅ | ❌ | ❌ |
| **Viewer** | ✅ Assigned | ✅ | ❌ | ❌ |

### Permission Granularity

Grant access at different levels:

```
Database Level:    production → Access all tables in 'production'
Table Level:       public.customers → Access only 'customers' table
```

---

## 🔌 API Reference

### Authentication

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Logout
POST /api/auth/logout

# Get current user
GET /api/auth/me
```

### Search & Browse

```bash
# Search
GET /api/search?q=customer&schema=production

# Get schemas
GET /api/schemas

# Get tables in schema
GET /api/schemas/production/tables

# Get table details
GET /api/schemas/production/tables/customers

# Get statistics
GET /api/stats
```

### Admin (Requires Admin Role)

```bash
# List users
GET /api/admin/users

# Create user
POST /api/admin/users
{
  "username": "john",
  "email": "john@example.com",
  "password": "secure123",
  "role": "viewer"
}

# Get user permissions
GET /api/admin/users/{user_id}/permissions

# Grant permission
POST /api/admin/users/{user_id}/permissions
{
  "resource_type": "database",
  "resource_name": "production",
  "permission_level": "read"
}

# Revoke permission
DELETE /api/admin/permissions/{permission_id}
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
YAML_DIRECTORY=./dbt_models
DATABASE_PATH=./data_dictionary.db
FLASK_ENV=production
```

### Security Settings

**Production Checklist:**
- [ ] Change `SECRET_KEY`
- [ ] Change `JWT_SECRET_KEY`  
- [ ] Change admin password
- [ ] Enable HTTPS
- [ ] Set CORS origins
- [ ] Use strong passwords

---

## 🚢 Deployment

### Development

```bash
python app.py
```

### Production (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker

```bash
# Build
docker build -t data-dictionary-web .

# Run
docker run -p 5000:5000 \
  -v /path/to/yaml:/app/dbt_models \
  data-dictionary-web
```

### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
}
```

---

## 📁 Project Structure

```
data_dictionary_web/
├── app.py                  # Main Flask application
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── templates/
│   ├── index.html         # Main search interface
│   └── admin.html         # Admin panel
├── data_dictionary.db     # SQLite database (created on first run)
└── COMPLETE_GUIDE.md      # Detailed documentation
```

---

## 🔒 Security

### Authentication

- JWT tokens for API authentication
- Session-based authentication for web interface
- Password hashing with Werkzeug (PBKDF2)
- CSRF protection

### Authorization

- Role-based access control (RBAC)
- Granular permissions at database and table level
- Activity logging for audit trails

### Best Practices

1. Use strong passwords
2. Enable HTTPS in production
3. Regular security audits
4. Keep dependencies updated
5. Monitor activity logs

---

## 🛠️ Development

### Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

### Setup Development Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run in development mode
export FLASK_ENV=development
python app.py
```

### Adding Features

The application is built with modularity in mind:

- **app.py** - Add new API endpoints here
- **templates/** - Modify HTML/CSS/JS for UI changes
- **config.py** - Add configuration options

---

## 🐛 Troubleshooting

### No YAML files found

```bash
# Check directory path
ls ./dbt_models/*.yml

# Update path in app.py
app.config['YAML_DIRECTORY'] = '/correct/path/to/yaml'
```

### User can't see tables

```bash
# Grant database permission via admin panel or SQL:
INSERT INTO permissions (user_id, resource_type, resource_name, permission_level)
VALUES (2, 'database', 'production', 'read');
```

### Port already in use

```bash
# Change port in app.py
app.run(port=5001)

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

---

## 📊 Database Schema

### Users
- id, username, email, password_hash, role, created_at, last_login

### Permissions
- id, user_id, resource_type, resource_name, permission_level

### Activity Log
- id, user_id, action, resource_type, resource_name, timestamp

---

## 🎯 Roadmap

- [ ] Export search results to CSV
- [ ] Advanced filters (column types, constraints)
- [ ] Data lineage visualization
- [ ] Comment/annotation system
- [ ] Email notifications for changes
- [ ] Integration with Slack
- [ ] API documentation with Swagger
- [ ] Multi-tenant support
- [ ] SSO/LDAP integration

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- Flask - Web framework
- SQLite - Database
- Vanilla JavaScript - No dependencies!
- Modern CSS - Responsive design

---

## 📞 Support

- **Documentation:** [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)
- **Issues:** Open an issue on GitHub
- **Email:** support@example.com

---

## 🎉 Quick Commands

```bash
# Install
pip install -r requirements.txt

# Run
python app.py

# Login
http://localhost:5000
admin / admin123

# Create user (via admin panel)
1. Login as admin
2. Go to /admin
3. Click "Add User"
4. Assign permissions

# Grant database access
resource_type: database
resource_name: production
permission_level: read
```

---

**Made with ❤️ for data teams everywhere**

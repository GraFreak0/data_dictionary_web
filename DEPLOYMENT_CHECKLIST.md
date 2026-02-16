# Data Dictionary Web UI - Deployment Checklist

## 📦 What You're Getting

A complete, production-ready web application with:

✅ **Full-featured web interface** with search, browse, and table details  
✅ **Role-based access control (RBAC)** - Admin, Contributor, Viewer  
✅ **User management system** - Create users, manage permissions  
✅ **RESTful API** - All features accessible via API  
✅ **Beautiful, modern UI** - Responsive, mobile-friendly design  
✅ **Security** - JWT auth, password hashing, activity logging  
✅ **Database** - SQLite (included), easy to migrate to PostgreSQL  
✅ **Documentation** - Complete guides and API reference  

---

## 📁 Files Included

```
data_dictionary_web/
├── app.py                   # Main Flask application (600+ lines)
├── config.py                # Configuration settings
├── requirements.txt         # Python dependencies
├── setup.py                 # Quick start setup script
├── README.md                # Project overview
├── COMPLETE_GUIDE.md        # Detailed documentation (500+ lines)
├── templates/
│   ├── index.html          # Main search interface (800+ lines)
│   └── admin.html          # Admin panel (400+ lines)
└── .env.example            # Environment variables template
```

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Extract Files

Extract the `data_dictionary_web` folder to your desired location.

### Step 2: Run Setup Script

```bash
cd data_dictionary_web
python setup.py
```

This will:
- Check Python version (3.8+ required)
- Install dependencies
- Configure YAML directory path
- Create .env file
- Initialize database
- Create default admin user

### Step 3: Start Application

```bash
python app.py
```

### Step 4: Access Application

Open browser: **http://localhost:5000**

Login:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change the admin password immediately!**

---

## ✅ Pre-Deployment Checklist

### Security
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Change `JWT_SECRET_KEY` in `.env`
- [ ] Change admin password (login → settings)
- [ ] Review user roles and permissions
- [ ] Enable HTTPS in production
- [ ] Set proper CORS origins

### Configuration
- [ ] Point `YAML_DIRECTORY` to your YAML files
- [ ] Verify YAML files are accessible
- [ ] Test database connectivity
- [ ] Configure email settings (if applicable)

### Testing
- [ ] Login works
- [ ] Search returns results
- [ ] Table details display correctly
- [ ] User creation works
- [ ] Permission grants work
- [ ] Admin panel accessible

### Production
- [ ] Use Gunicorn instead of Flask dev server
- [ ] Set up Nginx reverse proxy
- [ ] Configure systemd service
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring

---

## 🔐 Default Users & Roles

### Admin User (Created Automatically)
```
Username: admin
Password: admin123
Role: admin
Permissions: Full access to everything
```

**Change this password immediately!**

### Role Capabilities

| Feature | Admin | Contributor | Viewer |
|---------|-------|-------------|--------|
| View assigned databases | ✅ | ✅ | ✅ |
| Search & browse | ✅ | ✅ | ✅ |
| View table details | ✅ | ✅ | ✅ |
| Create users | ✅ | ❌ | ❌ |
| Manage permissions | ✅ | ❌ | ❌ |
| View activity logs | ✅ | ❌ | ❌ |
| Access admin panel | ✅ | ❌ | ❌ |

---

## 👥 Creating Your First Users

### Via Admin Panel (Recommended)

1. Login as admin
2. Click user avatar → "Admin Panel"
3. Click "+ Add User"
4. Fill in details:
   - Username (unique)
   - Email (unique)
   - Password
   - Role (viewer/contributor/admin)
5. Click "Create User"

### Via API

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "secure123",
    "role": "viewer"
  }'
```

---

## 🔑 Granting Permissions

### Database-Level Access

Grants access to ALL tables in a database:

```
Resource Type: database
Resource Name: production
Permission Level: read
```

User can now access all tables in `production` database.

### Table-Level Access

Grants access to SPECIFIC table only:

```
Resource Type: table
Resource Name: public.customers
Permission Level: read
```

User can only access `public.customers` table.

### Permission Examples

**Scenario 1: Analytics Team**
```
Resource Type: database
Resource Name: analytics
Level: read
→ Can view all analytics tables
```

**Scenario 2: Data Engineer**
```
Resource Type: database
Resource Name: production
Level: write
→ Can view and edit production tables
```

**Scenario 3: Product Manager**
```
Resource Type: table
Resource Name: public.user_metrics
Level: read
→ Can only view user_metrics table
```

---

## 🚢 Production Deployment

### Option 1: Systemd Service (Linux)

Create `/etc/systemd/system/data-dictionary.service`:

```ini
[Unit]
Description=Data Dictionary Web UI
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/data-dictionary
Environment="PATH=/var/www/data-dictionary/venv/bin"
ExecStart=/var/www/data-dictionary/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable data-dictionary
sudo systemctl start data-dictionary
sudo systemctl status data-dictionary
```

### Option 2: Docker

```bash
# Build
docker build -t data-dictionary-web .

# Run
docker run -d \
  -p 5000:5000 \
  -v /path/to/yaml:/app/dbt_models:ro \
  -v /path/to/db:/app/data \
  --name data-dictionary \
  data-dictionary-web
```

### Option 3: Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - /path/to/yaml:/app/dbt_models:ro
      - db-data:/app/data
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=your-secret-key
      - JWT_SECRET_KEY=your-jwt-secret
volumes:
  db-data:
```

---

## 🔧 Common Tasks

### Change Admin Password

1. Login as admin
2. Go to user profile
3. Change password
4. Save

Or via SQL:

```python
from werkzeug.security import generate_password_hash
import sqlite3

conn = sqlite3.connect('data_dictionary.db')
cursor = conn.cursor()
new_hash = generate_password_hash('new_password')
cursor.execute('UPDATE users SET password_hash = ? WHERE username = ?', (new_hash, 'admin'))
conn.commit()
```

### Add YAML Files

1. Copy your `.yml` files to YAML_DIRECTORY
2. Files should be named: `schema_<name>.yml`
3. Refresh browser - files are loaded dynamically

### Backup Database

```bash
# Simple copy
cp data_dictionary.db data_dictionary.db.backup

# Or use SQLite backup
sqlite3 data_dictionary.db ".backup data_dictionary.db.backup"
```

### View Activity Logs

```bash
sqlite3 data_dictionary.db "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 20;"
```

### Reset Admin Password (Emergency)

```bash
sqlite3 data_dictionary.db
UPDATE users SET password_hash = 'pbkdf2:sha256:600000$...' WHERE username = 'admin';
```

(Use setup script to regenerate hash)

---

## 📊 Monitoring & Maintenance

### Health Check Endpoint

```bash
curl http://localhost:5000/api/stats
```

Should return:
```json
{
  "schemas": 10,
  "tables": 150,
  "columns": 2000
}
```

### Logs

```bash
# Application logs
tail -f app.log

# Systemd logs
journalctl -u data-dictionary -f

# Nginx logs
tail -f /var/log/nginx/access.log
```

### Database Maintenance

```bash
# Vacuum database (reduce size)
sqlite3 data_dictionary.db "VACUUM;"

# Check integrity
sqlite3 data_dictionary.db "PRAGMA integrity_check;"

# Enable WAL mode (better concurrency)
sqlite3 data_dictionary.db "PRAGMA journal_mode=WAL;"
```

---

## 🐛 Troubleshooting

### Issue: "No YAML files found"

**Solution:**
1. Check YAML_DIRECTORY path in app.py
2. Verify files exist: `ls ./dbt_models/*.yml`
3. Ensure files are named: `schema_*.yml`

### Issue: "Access Denied" for user

**Solution:**
1. Login as admin
2. Admin Panel → Select user
3. Grant permission to database or table
4. Refresh user's browser

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or change port in app.py
app.run(port=5001)
```

### Issue: Database locked

**Solution:**
```bash
# Enable WAL mode
sqlite3 data_dictionary.db "PRAGMA journal_mode=WAL;"

# Or migrate to PostgreSQL for production
```

---

## 📚 Documentation

- **README.md** - Project overview
- **COMPLETE_GUIDE.md** - Full documentation (500+ lines)
- **This file** - Deployment checklist

### Key Sections in COMPLETE_GUIDE.md

- Installation instructions
- User roles and permissions
- API reference
- Configuration options
- Security best practices
- Troubleshooting guide

---

## 🎯 Next Steps After Deployment

1. **Create users for your team**
   - Data engineers (contributor role)
   - Analysts (viewer role)
   - Admins (admin role)

2. **Grant appropriate permissions**
   - Database-level for teams
   - Table-level for specific access

3. **Add documentation to tables**
   - Update YAML files with descriptions
   - Re-generate YAML from metadata

4. **Set up regular YAML updates**
   - Schedule metadata extraction
   - Auto-update YAML files
   - Keep catalog current

5. **Monitor usage**
   - Check activity logs
   - Review permissions quarterly
   - Remove inactive users

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Application accessible at http://localhost:5000
- [ ] Admin can login
- [ ] Search returns results from YAML files
- [ ] Table details display correctly
- [ ] New users can be created
- [ ] Permissions can be granted
- [ ] Non-admin users see only assigned data

---

## 🆘 Support

If you encounter issues:

1. Check **COMPLETE_GUIDE.md** troubleshooting section
2. Review application logs
3. Verify YAML files are valid
4. Check database permissions
5. Ensure all dependencies installed

---

## 🎉 You're Ready!

Your Data Dictionary Web UI is ready to use. Enjoy exploring your data catalog with:

✨ Beautiful search interface  
🔐 Secure RBAC  
👥 Easy user management  
📊 Insightful statistics  

**Happy data cataloging! 🚀**

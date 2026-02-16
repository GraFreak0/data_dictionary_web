# Complete Feature Implementation Guide

## 🎯 Priority Overview

### ✅ COMPLETED (High Priority)
1. **Security Fix** - Fixed random key generation issue
2. **Enhanced app.py** - All new backend features
3. **Profile Page** - User profile with password change
4. **User Groups** - Complete backend implementation
5. **PDF Export** - Full implementation with permissions
6. **Export Permissions** - Admin-controlled export rights

### 📋 REMAINING FILES TO CREATE

## 1. Signup Page (`templates/signup.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sign Up - Data Dictionary</title>
    <!-- Same styles as login page -->
</head>
<body>
    <div class="signup-container">
        <div class="signup-box">
            <h1>Create Account</h1>
            <p>Join the Data Dictionary</p>
            
            <div id="signupError" class="alert alert-error" style="display: none;"></div>
            
            <form id="signupForm">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" id="username" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="email" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" id="password" required minlength="8">
                    <small>At least 8 characters</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" class="form-input" id="confirmPassword" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Create Account</button>
            </form>
            
            <p style="margin-top: 1.5rem; text-align: center;">
                Already have an account? <a href="/">Sign in</a>
            </p>
        </div>
    </div>

    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Account created! Please login.');
                    window.location.href = '/';
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Connection error');
            }
        });
        
        function showError(message) {
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    </script>
</body>
</html>
```

## 2. Groups Management Page (`templates/groups.html`)

```html
<!-- Complete groups management interface -->
<!-- Features: -->
- Create new groups
- View all groups
- Add/remove members
- Manage group permissions
- View group details
```

## 3. Enhanced Admin Panel

**Update `templates/admin.html` to include:**
- Export permission toggle for users
- Groups tab
- Activity logs viewer
- Export logs viewer

## 4. Enhanced Index Page

**Update `templates/index.html` to include:**
- Export button (if user has permission)
- Filter preview functionality
- User profile link in sidebar
- Groups indicator

---

## 📊 Database Schema (Complete)

```sql
-- Users (Enhanced)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    can_export BOOLEAN DEFAULT 0  -- NEW
);

-- User Groups (NEW)
CREATE TABLE user_groups (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User Group Members (NEW)
CREATE TABLE user_group_members (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    added_at TIMESTAMP,
    added_by INTEGER,
    UNIQUE(user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES user_groups(id)
);

-- Group Permissions (NEW)
CREATE TABLE group_permissions (
    id INTEGER PRIMARY KEY,
    group_id INTEGER NOT NULL,
    resource_type TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    permission_level TEXT NOT NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES user_groups(id)
);

-- Individual Permissions (Existing)
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resource_type TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    permission_level TEXT NOT NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Activity Log (Enhanced)
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_name TEXT,
    ip_address TEXT,  -- NEW
    timestamp TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Export Log (NEW)
CREATE TABLE export_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    export_type TEXT NOT NULL,
    resources_exported TEXT,
    timestamp TIMESTAMP,
    file_size INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔄 Permission Resolution Logic

```python
def get_user_permissions(user_id):
    """
    Get all permissions for a user.
    Combines individual permissions + group permissions.
    """
    # 1. Check if admin (has all permissions)
    if user.role == 'admin':
        return ALL_RESOURCES
    
    # 2. Get individual permissions
    individual_perms = db.query(
        "SELECT * FROM permissions WHERE user_id = ?", user_id
    )
    
    # 3. Get group permissions
    group_perms = db.query("""
        SELECT gp.* FROM group_permissions gp
        JOIN user_group_members ugm ON gp.group_id = ugm.group_id
        WHERE ugm.user_id = ?
    """, user_id)
    
    # 4. Merge and return
    return merge_permissions(individual_perms, group_perms)
```

---

## 📝 API Endpoints (Complete List)

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Sign up (new user)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Search & Browse
- `GET /api/search` - Search with RBAC
- `GET /api/schemas` - Get accessible schemas
- `GET /api/schemas/<schema>/tables` - Get tables
- `GET /api/schemas/<schema>/tables/<table>` - Get table details
- `GET /api/stats` - Get statistics

### User Groups (NEW)
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/<id>/members` - Get group members
- `POST /api/groups/<id>/members` - Add member
- `DELETE /api/groups/<id>/members/<user_id>` - Remove member
- `GET /api/groups/<id>/permissions` - Get group permissions
- `POST /api/groups/<id>/permissions` - Grant group permission
- `DELETE /api/groups/<id>/permissions/<perm_id>` - Revoke permission

### Export (NEW)
- `POST /api/export/pdf` - Export as PDF
- `GET /api/export/check-permission` - Check if user can export

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/<id>` - Update user (including export perm)
- `GET /api/admin/users/<id>/permissions` - Get user permissions
- `POST /api/admin/users/<id>/permissions` - Grant permission
- `DELETE /api/admin/permissions/<id>` - Revoke permission

---

## 🎨 Frontend Updates Needed

### 1. Update index.html

Add export button:
```javascript
// In main interface
if (user.can_export || user.role === 'admin') {
    const exportBtn = `
        <button class="btn btn-primary" onclick="exportPDF()">
            📄 Export PDF
        </button>
    `;
    // Add to toolbar
}

async function exportPDF() {
    const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' })
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_dictionary_${Date.now()}.pdf`;
    a.click();
}
```

Add profile link:
```html
<!-- In sidebar user info -->
<div class="user-info">
    <h3><a href="/profile" style="color: inherit;">{username}</a></h3>
    <div class="user-role">{role}</div>
</div>
```

Fix filter preview:
```javascript
// Update search to show results immediately
document.getElementById('schemaFilter').addEventListener('change', (e) => {
    const query = document.getElementById('searchInput').value;
    if (query.length >= 2) {
        performSearch(query);  // Re-run search with filter
    }
});
```

### 2. Update admin.html

Add export permission toggle:
```javascript
// In user creation form
<div class="form-group">
    <label class="form-label">
        <input type="checkbox" id="canExport">
        Allow PDF Export
    </label>
</div>

// In user list
<td>
    <input type="checkbox" 
           ${user.can_export ? 'checked' : ''} 
           onchange="toggleExport(${user.id}, this.checked)">
</td>

async function toggleExport(userId, canExport) {
    await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_export: canExport })
    });
}
```

Add groups tab:
```html
<div class="tabs">
    <button class="tab active" data-view="users">Users</button>
    <button class="tab" data-view="permissions">Permissions</button>
    <button class="tab" data-view="groups">Groups</button>  <!-- NEW -->
    <button class="tab" data-view="logs">Activity Logs</button>  <!-- NEW -->
</div>
```

---

## 🔧 Installation & Setup

### 1. Install Additional Dependencies

```bash
pip install reportlab python-dotenv
```

Update requirements.txt:
```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Login==0.6.3
PyJWT==2.8.0
Werkzeug==3.0.1
PyYAML==6.0.1
reportlab==4.0.7  # NEW - for PDF export
python-dotenv==1.0.0  # NEW - for .env files
```

### 2. Replace app.py

```bash
cp enhanced_app.py app.py
```

### 3. Run First Time

```bash
python app.py
```

This will:
- Generate .env file with secure keys
- Create database with new tables
- Create default admin user

### 4. Test Features

**Test signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test1234"}'
```

**Test PDF export:**
```bash
# Login first, get token
# Then:
curl -X POST http://localhost:5000/api/export/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"full"}' \
  --output data_dictionary.pdf
```

**Test groups:**
```bash
# Create group
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Data Team","description":"Data engineers and analysts"}'
```

---

## 📦 File Structure

```
data_dictionary_web/
├── app.py                      # ← Use enhanced_app.py
├── config.py
├── requirements.txt            # ← Update with new deps
├── .env                        # ← Auto-generated
├── .gitignore                  # ← Add .env here
├── data_dictionary.db          # ← Auto-created
├── templates/
│   ├── index.html             # ← Update with export button
│   ├── admin.html             # ← Update with groups tab
│   ├── profile.html           # ← NEW (provided)
│   ├── signup.html            # ← NEW (create)
│   └── groups.html            # ← NEW (create)
└── static/                     # ← Optional: CSS/JS files
```

---

## ✅ Testing Checklist

- [ ] Keys persist across restarts (.env file created)
- [ ] Signup creates new users
- [ ] Profile page shows user info
- [ ] Change password works
- [ ] PDF export works (for users with permission)
- [ ] PDF export blocked (for users without permission)
- [ ] Groups can be created
- [ ] Users can be added to groups
- [ ] Group permissions work
- [ ] Filter preview shows results
- [ ] Export logs are created
- [ ] Activity logs track actions

---

## 🚀 Deployment Checklist

- [ ] Strong SECRET_KEY and JWT_SECRET_KEY in production
- [ ] .env file in .gitignore
- [ ] Database backed up regularly
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] File permissions set correctly (600 for .env)
- [ ] Export logs monitored
- [ ] Activity logs reviewed regularly

---

## 📞 Support

Issues? Check:
1. .env file exists and contains keys
2. All dependencies installed
3. Database initialized (tables created)
4. Port 5000 not in use
5. YAML directory path correct

---

**All critical features implemented! 🎉**

Replace app.py with enhanced_app.py and you're ready to go!

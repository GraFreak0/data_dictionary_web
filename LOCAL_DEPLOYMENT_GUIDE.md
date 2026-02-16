# Data Dictionary Web UI - Local Deployment Guide

## 🏠 Local Deployment (Single Machine)

This guide is for deploying the Data Dictionary Web UI on a **single local machine** for team use on your internal network.

---

## 📋 What "Local Deployment" Means

✅ **Runs on your local network**  
✅ **Accessible by team members on the same network**  
✅ **No cloud hosting required**  
✅ **No domain name needed**  
✅ **Simple setup**  
✅ **Low maintenance**  

**Perfect for:**
- Small to medium teams (5-50 users)
- Internal company networks
- Development/staging environments
- Proof of concept deployments
- Teams without cloud infrastructure

---

## 🚀 Quick Setup (10 Minutes)

### Prerequisites

- **Windows/Mac/Linux computer** that stays on during work hours
- **Python 3.8+** installed
- **Network connection** for team access
- **YAML files** from your data dictionary generator

### Step 1: Extract Files

Extract the `data_dictionary_web` folder to a location on your machine:

```
C:\DataDictionary\data_dictionary_web\     (Windows)
/home/user/data_dictionary_web/            (Linux)
/Users/username/data_dictionary_web/       (Mac)
```

### Step 2: Run Setup

Open terminal/command prompt in the folder:

```bash
cd data_dictionary_web
python setup.py
```

**What this does:**
- ✅ Checks Python version
- ✅ Installs dependencies
- ✅ Asks for YAML directory path
- ✅ Creates database
- ✅ Creates default admin user

**Follow the prompts:**
```
Enter path to your YAML files: C:\dbt_models
✓ Configuration complete
✓ Database initialized

Default admin user created:
  Username: admin
  Password: admin123
```

### Step 3: Start the Application

```bash
python app.py
```

**You should see:**
```
* Running on http://0.0.0.0:5000
* Running on http://192.168.1.100:5000  ← Your local IP
```

**Keep this terminal window open!** Closing it stops the application.

### Step 4: Access Locally

Open your browser:
```
http://localhost:5000
```

Login with:
- Username: `admin`
- Password: `admin123`

**⚠️ Change the password immediately!**

---

## 🌐 Making It Accessible to Your Team

### Find Your Local IP Address

**Windows:**
```cmd
ipconfig
Look for "IPv4 Address": 192.168.1.100
```

**Mac/Linux:**
```bash
ifconfig
Look for "inet": 192.168.1.100

# Or simpler:
hostname -I
```

### Share Access with Your Team

**Give your team this URL:**
```
http://192.168.1.100:5000
```

Replace `192.168.1.100` with YOUR actual IP address.

**Example Team Communication:**
```
Hi team,

Our Data Dictionary is now available at:
http://192.168.1.100:5000

Login with your username and password.
If you don't have credentials yet, contact me.

- Your Name
```

### Firewall Configuration

**Windows:**
```
1. Windows Defender Firewall
2. Advanced Settings
3. Inbound Rules → New Rule
4. Port → TCP → 5000
5. Allow the connection
6. Name: "Data Dictionary"
```

**Mac:**
```bash
System Preferences → Security & Privacy → Firewall
→ Firewall Options
→ Add Python
→ Allow incoming connections
```

**Linux:**
```bash
sudo ufw allow 5000/tcp
# Or
sudo firewall-cmd --add-port=5000/tcp --permanent
```

---

## 💻 Running the Application

### Option 1: Terminal Window (Simple)

**Start:**
```bash
cd data_dictionary_web
python app.py
```

**Pros:**
- ✅ Simple
- ✅ See logs in real-time
- ✅ Easy to stop (Ctrl+C)

**Cons:**
- ❌ Must keep terminal open
- ❌ Stops when you log out
- ❌ No auto-restart

### Option 2: Background Process (Better)

**Windows:**
```cmd
# Start in background
start /B python app.py > app.log 2>&1

# Or create a batch file: start.bat
@echo off
python app.py
pause
```

Double-click `start.bat` to run.

**Mac/Linux:**
```bash
# Start in background
nohup python app.py > app.log 2>&1 &

# Check if running
ps aux | grep "python app.py"

# Stop
pkill -f "python app.py"
```

### Option 3: Auto-Start on Boot (Best)

**Windows (Task Scheduler):**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Data Dictionary"
4. Trigger: "When computer starts"
5. Action: "Start a program"
6. Program: `C:\Python310\python.exe`
7. Arguments: `C:\DataDictionary\data_dictionary_web\app.py`
8. Finish

**Mac (Launch Agent):**

Create `~/Library/LaunchAgents/com.datadictionary.app.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.datadictionary.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/username/data_dictionary_web/app.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.datadictionary.app.plist
```

**Linux (systemd):**

Create `/etc/systemd/system/data-dictionary.service`:

```ini
[Unit]
Description=Data Dictionary Web UI
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/data_dictionary_web
ExecStart=/usr/bin/python3 /home/yourusername/data_dictionary_web/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable data-dictionary
sudo systemctl start data-dictionary
sudo systemctl status data-dictionary
```

---

## 👥 User Management

### Creating Team Members

1. **Login as admin** (http://localhost:5000)
2. **Go to Admin Panel** (user icon → Admin Panel)
3. **Click "+ Add User"**
4. **Fill in details:**
   - Username: `john.doe`
   - Email: `john@company.com`
   - Password: `temp123` (they should change this)
   - Role: `viewer` or `contributor`
5. **Click "Create User"**

### Granting Permissions

After creating a user:

1. **Select the user** from dropdown
2. **Click "Grant Permission"**
3. **Choose access level:**

**For full database access:**
```
Resource Type: database
Resource Name: production
Permission Level: read
```

**For specific table access:**
```
Resource Type: table
Resource Name: public.customers
Permission Level: read
```

4. **Click "Grant Permission"**

### Initial User Setup Example

```
User: john.doe (Data Analyst)
Role: viewer
Permissions:
  - database: analytics (read)
  - database: production (read)

User: jane.smith (Data Engineer)
Role: contributor
Permissions:
  - database: production (read)
  - database: staging (write)
  - database: development (admin)

User: admin (You)
Role: admin
Permissions: All (automatic)
```

---

## 📂 Setting Up YAML Files

### Where to Put YAML Files

The application needs your YAML files. During setup, you specified a directory.

**Recommended structure:**
```
C:\DataDictionary\
├── data_dictionary_web\    # Application
└── dbt_models\             # Your YAML files
    ├── schema_production.yml
    ├── schema_analytics.yml
    └── schema_staging.yml
```

### Updating YAML Files

When you regenerate YAML files from your databases:

1. **Run your metadata extraction:**
```bash
python extract_metadata.py
# Generates new YAML files
```

2. **Copy to YAML directory:**
```bash
# Windows
copy /Y dbt_models\*.yml C:\DataDictionary\dbt_models\

# Linux/Mac
cp dbt_models/*.yml /home/user/DataDictionary/dbt_models/
```

3. **Refresh browser** - Changes appear immediately!

### Automating YAML Updates

**Windows (Task Scheduler):**
Create a scheduled task to run your extraction script daily.

**Linux/Mac (cron):**
```bash
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd /path/to/extractor && python extract_metadata.py
```

---

## 🔧 Maintenance

### Daily Tasks

✅ **None!** - Application runs on its own

### Weekly Tasks

✅ **Check application is running:**
```bash
# Open in browser
http://localhost:5000

# Should show login page
```

### Monthly Tasks

✅ **Update YAML files** (if database schema changed)  
✅ **Review user permissions**  
✅ **Remove inactive users**  
✅ **Backup database**

### Backup

**Backup the database:**
```bash
# Windows
copy data_dictionary.db data_dictionary.db.backup

# Linux/Mac
cp data_dictionary.db data_dictionary.db.backup
```

**Backup YAML files:**
```bash
# Already backed up in your source control!
```

---

## 🐛 Troubleshooting

### Problem: Can't Access from Other Computers

**Solution 1: Check Firewall**
```bash
# Windows: Allow port 5000
# Mac: Add Python to firewall exceptions
# Linux: sudo ufw allow 5000
```

**Solution 2: Verify IP Address**
```bash
# Make sure you're using the correct IP
ipconfig (Windows)
ifconfig (Mac/Linux)
```

**Solution 3: Check Application is Running**
```bash
# Should see "Running on http://0.0.0.0:5000"
```

### Problem: "No YAML Files Found"

**Solution:**
```bash
# Check YAML directory path in app.py
# Line 15: app.config['YAML_DIRECTORY'] = './dbt_models'

# Verify files exist
dir dbt_models\*.yml (Windows)
ls dbt_models/*.yml (Linux/Mac)
```

### Problem: Application Stops Running

**Solution:**
```bash
# Use background process or auto-start
# See "Running the Application" section above
```

### Problem: Port 5000 Already in Use

**Solution:**
```python
# Edit app.py, change last line:
app.run(debug=True, host='0.0.0.0', port=5001)
# Then use http://localhost:5001
```

### Problem: Users Can't See Any Data

**Solution:**
```
1. Login as admin
2. Admin Panel → Select user
3. Grant permission to at least one database
4. User refreshes browser
```

---

## 📊 Monitoring

### Check Application Status

**View logs:**
```bash
# If running in terminal: visible in terminal
# If running in background: check app.log
tail -f app.log (Linux/Mac)
type app.log (Windows)
```

### View Activity

Login as admin and check activity logs:

```bash
# Via SQL
sqlite3 data_dictionary.db
SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 20;
```

### Check Disk Space

```bash
# Database size
ls -lh data_dictionary.db

# YAML files size
du -sh dbt_models/
```

---

## 🎯 Best Practices for Local Deployment

### 1. Dedicated Machine

✅ **Use a machine that:**
- Stays on during work hours
- Has reliable power
- Has good network connection
- Isn't used for heavy tasks

### 2. Regular Backups

✅ **Backup weekly:**
```bash
# Simple backup script
date=$(date +%Y%m%d)
cp data_dictionary.db backups/data_dictionary_$date.db
```

### 3. Network Stability

✅ **Use static IP or:**
- Configure DHCP reservation in router
- Use hostname instead: `http://computer-name:5000`

### 4. User Training

✅ **Create simple guide for team:**
```
How to Use Data Dictionary:

1. Go to: http://192.168.1.100:5000
2. Login with your credentials
3. Use search bar to find tables
4. Click any result for details
5. Contact [admin] for access issues
```

### 5. Access Control

✅ **Follow principle of least privilege:**
- Most users: `viewer` role
- Data team: `contributor` role
- 1-2 people: `admin` role

---

## 📞 Team Support

### Quick Reference Card

Give this to your team:

```
┌─────────────────────────────────────────┐
│     Data Dictionary Quick Reference      │
├─────────────────────────────────────────┤
│ URL: http://192.168.1.100:5000         │
│                                          │
│ Search:                                  │
│   • Type in search bar                   │
│   • Filter by schema or type             │
│   • Click results for details            │
│                                          │
│ Need Access?                             │
│   Contact: [Your Name]                   │
│   Email: your@email.com                  │
│                                          │
│ Forgot Password?                         │
│   Contact admin for reset                │
│                                          │
│ Issues?                                  │
│   Email: support@yourcompany.com         │
└─────────────────────────────────────────┘
```

---

## ✅ Local Deployment Checklist

- [ ] Python 3.8+ installed
- [ ] Application extracted to permanent location
- [ ] `python setup.py` completed
- [ ] YAML files directory configured
- [ ] Application started and running
- [ ] Can access on localhost
- [ ] Firewall configured
- [ ] Team can access via local IP
- [ ] Admin password changed
- [ ] Initial users created
- [ ] Permissions granted
- [ ] Documentation shared with team
- [ ] Backup strategy in place

---

## 🎉 You're Ready!

Your Data Dictionary is now running locally and accessible to your team!

**Remember:**
- Keep the application running
- Update YAML files regularly
- Manage user permissions
- Backup database monthly

**For questions, check:**
- This guide
- COMPLETE_GUIDE.md
- README.md

**Happy data cataloging! 📚**

"""
Data Dictionary Web UI - Flask Backend with RBAC
ENHANCED VERSION with User Groups, PDF Export, and Complete Features
"""

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import yaml
import os
import sqlite3
from datetime import datetime, timedelta
import jwt
from typing import List, Dict, Any, Optional
import secrets
from dotenv import load_dotenv
import io

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# Exporter Plugin Loader
# ============================================================================
# Auto-discovers every BaseExporter subclass in the `exporters/` package.
# Drop a new file into that directory — no changes to app.py required.

import importlib, pkgutil, sys, os

def load_exporters() -> dict:
    """
    Walk the exporters/ package, import every module, then collect all
    concrete subclasses of BaseExporter.  Returns {name: instance}.
    """
    from exporters.base import BaseExporter

    # Make sure the exporters directory next to app.py is importable
    exporters_dir = os.path.join(os.path.dirname(__file__), 'exporters')
    if exporters_dir not in sys.path:
        sys.path.insert(0, os.path.dirname(__file__))

    import exporters as _exporters_pkg
    for _finder, _modname, _ispkg in pkgutil.iter_modules(_exporters_pkg.__path__):
        if _modname != 'base':
            importlib.import_module(f'exporters.{_modname}')

    found = {}
    for cls in BaseExporter.__subclasses__():
        if cls.name:
            found[cls.name] = cls()
    return found

EXPORTERS: dict = load_exporters()


def _build_export_data(user, export_type: str, resources: list) -> dict:
    """
    Build the normalised data dict that is passed to every exporter.
    Applies per-user RBAC filtering so exporters never need to.
    """
    from datetime import datetime as _dt

    yaml_data            = load_yaml_files()
    accessible_resources = get_user_accessible_resources(user.id)

    schemas = []
    for filename, file_data in yaml_data.items():
        if not file_data or 'models' not in file_data:
            continue
        schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        if schema_name not in accessible_resources['databases']:
            continue
        if resources and schema_name not in resources:
            continue

        tables = []
        for model in file_data.get('models', []):
            tables.append({
                'name':        model.get('name', ''),
                'description': model.get('description', ''),
                'columns': [
                    {
                        'name':        col.get('name', ''),
                        'data_type':   col.get('data_type', ''),
                        'description': col.get('description', ''),
                    }
                    for col in model.get('columns', [])
                ],
            })
        schemas.append({'name': schema_name, 'tables': tables})

    return {
        'meta': {
            'generated_by': user.username,
            'generated_at': _dt.now().strftime('%Y-%m-%d %H:%M:%S'),
            'export_type':  export_type,
        },
        'schemas': schemas,
    }


app = Flask(__name__)

# ============================================================================
# CRITICAL: Secure Configuration (Fixed)
# ============================================================================

def load_or_generate_keys():
    """Load keys from environment or generate and save them."""
    secret_key = os.getenv('SECRET_KEY')
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    
    if not secret_key or not jwt_secret:
        print("=" * 70)
        print("⚠️  SECRET KEYS NOT FOUND!")
        print("=" * 70)
        print("Generating new keys and saving to .env file...")
        print()
        
        secret_key = secrets.token_hex(32)
        jwt_secret = secrets.token_hex(32)
        
        # Create or append to .env
        env_path = '.env'
        mode = 'a' if os.path.exists(env_path) else 'w'
        
        with open(env_path, mode) as f:
            if mode == 'a':
                f.write('\n')
            f.write('# Auto-generated secret keys\n')
            f.write(f'SECRET_KEY={secret_key}\n')
            f.write(f'JWT_SECRET_KEY={jwt_secret}\n')
            f.write('\n# Configuration\n')
            f.write('YAML_DIRECTORY=./dbt_models\n')
            f.write('DATABASE=./data_dictionary.db\n')
        
        print(f"✓ Keys saved to {env_path}")
        print("⚠️  IMPORTANT: Keep .env file secure!")
        print("⚠️  Add .env to .gitignore")
        print("=" * 70)
        print()
    
    return secret_key, jwt_secret

SECRET_KEY, JWT_SECRET_KEY = load_or_generate_keys()

app.config['SECRET_KEY'] = SECRET_KEY
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['YAML_DIRECTORY'] = os.getenv('YAML_DIRECTORY', './models')
app.config['DATABASE'] = os.getenv('DATABASE', './data_dictionary.db')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)


# ============================================================================
# Database Models & Setup (Enhanced with User Groups & Export Permissions)
# ============================================================================

def init_db():
    """Initialize the SQLite database with all tables."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            can_export BOOLEAN DEFAULT 0
        )
    ''')
    
    # User Groups table (NEW)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # User Group Membership table (NEW)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            added_by INTEGER,
            UNIQUE(user_id, group_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (group_id) REFERENCES user_groups (id),
            FOREIGN KEY (added_by) REFERENCES users (id)
        )
    ''')
    
    # Group Permissions table (NEW)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            resource_type TEXT NOT NULL,
            resource_name TEXT NOT NULL,
            permission_level TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES user_groups (id)
        )
    ''')
    
    # Permissions table (existing - for individual user permissions)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            resource_type TEXT NOT NULL,
            resource_name TEXT NOT NULL,
            permission_level TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Activity log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_name TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Export log (NEW)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS export_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            export_type TEXT NOT NULL,
            resources_exported TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_size INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create default admin user if not exists
    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        admin_password = generate_password_hash('admin123')
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, can_export)
            VALUES (?, ?, ?, ?, ?)
        ''', ('admin', 'admin@example.com', admin_password, 'admin', 1))
    
    conn.commit()
    conn.close()


class User(UserMixin):
    """User model for Flask-Login."""
    
    def __init__(self, id, username, email, role, can_export=False):
        self.id = id
        self.username = username
        self.email = email
        self.role = role
        self.can_export = can_export
    
    @staticmethod
    def get(user_id):
        """Get user by ID."""
        conn = sqlite3.connect(app.config['DATABASE'])
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, role, can_export FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(row[0], row[1], row[2], row[3], bool(row[4]))
        return None
    
    @staticmethod
    def get_by_username(username):
        """Get user by username."""
        conn = sqlite3.connect(app.config['DATABASE'])
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, role, password_hash, can_export FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    @staticmethod
    def get_by_email(email):
        """Get user by email."""
        conn = sqlite3.connect(app.config['DATABASE'])
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, role, can_export FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        return row


@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login."""
    return User.get(user_id)


# ============================================================================
# RBAC Decorators & Helper Functions
# ============================================================================

def role_required(*roles):
    """Decorator to require specific roles."""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def export_permission_required(f):
    """Decorator to require export permission."""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.can_export and current_user.role != 'admin':
            return jsonify({'error': 'Export permission required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def check_resource_access(user_id: int, resource_type: str, resource_name: str) -> bool:
    """
    Check if user has access to a specific resource.
    Checks both individual permissions and group permissions.
    """
    # Admin has access to everything
    user = User.get(user_id)
    if user and user.role == 'admin':
        return True
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Check individual permissions
    cursor.execute('''
        SELECT * FROM permissions 
        WHERE user_id = ? AND resource_type = ? AND resource_name = ?
    ''', (user_id, resource_type, resource_name))
    
    if cursor.fetchone():
        conn.close()
        return True
    
    # Check group permissions
    cursor.execute('''
        SELECT gp.* FROM group_permissions gp
        JOIN user_group_members ugm ON gp.group_id = ugm.group_id
        WHERE ugm.user_id = ? AND gp.resource_type = ? AND gp.resource_name = ?
    ''', (user_id, resource_type, resource_name))
    
    result = cursor.fetchone()
    conn.close()
    
    return result is not None


def get_user_accessible_resources(user_id: int) -> Dict[str, List[str]]:
    """Get all resources accessible to user (from both individual and group permissions)."""
    user = User.get(user_id)
    if user and user.role == 'admin':
        # Admin has access to everything - return all from YAML
        yaml_data = load_yaml_files()
        databases = list(yaml_data.keys())
        return {'databases': [db.replace('schema_', '').replace('.yml', '') for db in databases]}
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Get individual permissions
    cursor.execute('''
        SELECT DISTINCT resource_type, resource_name 
        FROM permissions 
        WHERE user_id = ?
    ''', (user_id,))
    
    individual_perms = cursor.fetchall()
    
    # Get group permissions
    cursor.execute('''
        SELECT DISTINCT gp.resource_type, gp.resource_name
        FROM group_permissions gp
        JOIN user_group_members ugm ON gp.group_id = ugm.group_id
        WHERE ugm.user_id = ?
    ''', (user_id,))
    
    group_perms = cursor.fetchall()
    conn.close()
    
    # Combine permissions
    all_perms = individual_perms + group_perms
    
    resources = {'databases': [], 'tables': []}
    for perm_type, perm_name in all_perms:
        if perm_type == 'database':
            resources['databases'].append(perm_name)
        elif perm_type == 'table':
            resources['tables'].append(perm_name)
    
    return resources


def log_activity(user_id: int, action: str, resource_type: str = None, resource_name: str = None):
    """Log user activity."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    ip_address = request.remote_addr
    
    cursor.execute('''
        INSERT INTO activity_log (user_id, action, resource_type, resource_name, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, action, resource_type, resource_name, ip_address))
    conn.commit()
    conn.close()


# ============================================================================
# YAML File Processing
# ============================================================================

def load_yaml_files() -> Dict[str, Any]:
    """Load all YAML files from the configured directory."""
    yaml_data = {}
    yaml_dir = app.config['YAML_DIRECTORY']
    
    if not os.path.exists(yaml_dir):
        return yaml_data
    
    for filename in os.listdir(yaml_dir):
        if filename.endswith('.yml') or filename.endswith('.yaml'):
            filepath = os.path.join(yaml_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    yaml_data[filename] = data
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    
    return yaml_data


def search_metadata(query: str, user_id: int, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Search metadata with RBAC filtering.
    """
    yaml_data = load_yaml_files()
    results = []
    query_lower = query.lower()
    
    for filename, data in yaml_data.items():
        if not data or 'models' not in data:
            continue
        
        schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        
        # Check if user has access to this schema
        if not check_resource_access(user_id, 'database', schema_name):
            continue
        
        for model in data.get('models', []):
            table_name = model.get('name', '')
            
            # Apply filters
            if filters:
                if filters.get('schema') and schema_name != filters['schema']:
                    continue
                if filters.get('table_type'):
                    table_type = model.get('meta', {}).get('table_type', '')
                    if table_type != filters['table_type']:
                        continue
            
            # Search in table name
            if query_lower in table_name.lower():
                results.append({
                    'type': 'table',
                    'schema': schema_name,
                    'table': table_name,
                    'description': model.get('description', ''),
                    'meta': model.get('meta', {}),
                    'column_count': len(model.get('columns', []))
                })
            
            # Search in table description
            table_desc = model.get('description', '')
            if table_desc and query_lower in table_desc.lower():
                if not any(r['table'] == table_name and r['schema'] == schema_name and r['type'] == 'table' for r in results):
                    results.append({
                        'type': 'table',
                        'schema': schema_name,
                        'table': table_name,
                        'description': table_desc,
                        'meta': model.get('meta', {}),
                        'column_count': len(model.get('columns', []))
                    })
            
            # Search in columns
            for column in model.get('columns', []):
                column_name = column.get('name', '')
                column_desc = column.get('description', '')
                
                if query_lower in column_name.lower() or (column_desc and query_lower in column_desc.lower()):
                    results.append({
                        'type': 'column',
                        'schema': schema_name,
                        'table': table_name,
                        'column': column_name,
                        'data_type': column.get('data_type', ''),
                        'description': column_desc,
                        'meta': column.get('meta', {})
                    })
    
    return results


def get_table_details(schema: str, table: str, user_id: int) -> Optional[Dict[str, Any]]:
    """Get detailed information about a specific table."""
    if not check_resource_access(user_id, 'database', schema):
        return None
    
    yaml_data = load_yaml_files()
    
    for filename, data in yaml_data.items():
        file_schema = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        
        if file_schema != schema:
            continue
        
        for model in data.get('models', []):
            if model.get('name') == table:
                return {
                    'schema': schema,
                    'table': table,
                    'description': model.get('description', ''),
                    'meta': model.get('meta', {}),
                    'columns': model.get('columns', [])
                }
    
    return None


# ============================================================================
# API Endpoints - Authentication
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user_data = User.get_by_username(username)
    
    if not user_data:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user_id, db_username, email, role, password_hash, can_export = user_data
    
    if not check_password_hash(password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create user object and login
    user = User(user_id, db_username, email, role, can_export)
    login_user(user)
    
    # Update last login
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.now(), user_id))
    conn.commit()
    conn.close()
    
    # Log activity
    log_activity(user_id, 'login')
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user_id,
            'username': username,
            'email': email,
            'role': role,
            'can_export': can_export
        }
    })


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User signup endpoint (open registration or invite-only based on config)."""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not all([username, email, password]):
        return jsonify({'error': 'All fields required'}), 400
    
    # Validate password strength
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # Check if user exists
    if User.get_by_username(username):
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.get_by_email(email):
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create user with viewer role by default
    password_hash = generate_password_hash(password)
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, can_export)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, password_hash, 'viewer', 0))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user_id': user_id
        }), 201
        
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 409


@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """User logout endpoint."""
    log_activity(current_user.id, 'logout')
    logout_user()
    return jsonify({'success': True})


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current logged-in user information."""
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'role': current_user.role,
        'can_export': current_user.can_export
    })


@app.route('/api/auth/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password."""
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not all([current_password, new_password]):
        return jsonify({'error': 'Both passwords required'}), 400
    
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    # Verify current password
    user_data = User.get_by_username(current_user.username)
    if not check_password_hash(user_data[4], current_password):
        return jsonify({'error': 'Current password incorrect'}), 401
    
    # Update password
    new_hash = generate_password_hash(new_password)
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, current_user.id))
    conn.commit()
    conn.close()
    
    log_activity(current_user.id, 'password_change')
    
    return jsonify({'success': True, 'message': 'Password changed successfully'})


# ============================================================================
# API Endpoints - Search & Browse
# ============================================================================

@app.route('/api/search', methods=['GET'])
@login_required
def search():
    """Search endpoint with RBAC filtering."""
    query = request.args.get('q', '')
    schema_filter = request.args.get('schema')
    table_type_filter = request.args.get('table_type')
    
    if not query or len(query) < 2:
        return jsonify({'error': 'Query must be at least 2 characters'}), 400
    
    filters = {}
    if schema_filter:
        filters['schema'] = schema_filter
    if table_type_filter:
        filters['table_type'] = table_type_filter
    
    results = search_metadata(query, current_user.id, filters)
    
    log_activity(current_user.id, 'search', resource_name=query)
    
    return jsonify({
        'query': query,
        'results': results,
        'count': len(results)
    })


@app.route('/api/schemas', methods=['GET'])
@login_required
def get_schemas():
    """Get list of schemas/databases the user has access to."""
    yaml_data = load_yaml_files()
    schemas = []
    
    for filename in yaml_data.keys():
        schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        
        if check_resource_access(current_user.id, 'database', schema_name):
            table_count = len(yaml_data[filename].get('models', []))
            schemas.append({
                'name': schema_name,
                'table_count': table_count
            })
    
    return jsonify({'schemas': schemas})


@app.route('/api/schemas/<schema>/tables', methods=['GET'])
@login_required
def get_tables(schema):
    """Get tables in a specific schema."""
    if not check_resource_access(current_user.id, 'database', schema):
        return jsonify({'error': 'Access denied'}), 403
    
    yaml_data = load_yaml_files()
    tables = []
    
    for filename, data in yaml_data.items():
        file_schema = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        
        if file_schema == schema:
            for model in data.get('models', []):
                tables.append({
                    'name': model.get('name'),
                    'description': model.get('description', ''),
                    'column_count': len(model.get('columns', [])),
                    'meta': model.get('meta', {})
                })
            break
    
    log_activity(current_user.id, 'browse_tables', 'schema', schema)
    
    return jsonify({'schema': schema, 'tables': tables})


@app.route('/api/schemas/<schema>/tables/<table>', methods=['GET'])
@login_required
def get_table(schema, table):
    """Get detailed information about a specific table."""
    if not check_resource_access(current_user.id, 'database', schema):
        return jsonify({'error': 'Access denied'}), 403
    
    table_data = get_table_details(schema, table, current_user.id)
    
    if not table_data:
        return jsonify({'error': 'Table not found'}), 404
    
    log_activity(current_user.id, 'view_table', 'table', f"{schema}.{table}")
    
    return jsonify(table_data)


@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    """Get statistics about the data dictionary."""
    yaml_data = load_yaml_files()
    
    total_schemas = 0
    total_tables = 0
    total_columns = 0
    
    for filename, data in yaml_data.items():
        schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        
        if not check_resource_access(current_user.id, 'database', schema_name):
            continue
        
        total_schemas += 1
        for model in data.get('models', []):
            total_tables += 1
            total_columns += len(model.get('columns', []))
    
    return jsonify({
        'schemas': total_schemas,
        'tables': total_tables,
        'columns': total_columns
    })


# ============================================================================
# API Endpoints - User Groups (NEW)
# ============================================================================

@app.route('/api/groups', methods=['GET'])
@role_required('admin', 'contributor')
def get_groups():
    """Get all user groups."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT g.id, g.name, g.description, g.created_at, u.username as created_by,
               COUNT(ugm.user_id) as member_count
        FROM user_groups g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN user_group_members ugm ON g.id = ugm.group_id
        GROUP BY g.id
    ''')
    
    groups = []
    for row in cursor.fetchall():
        groups.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'created_at': row[3],
            'created_by': row[4],
            'member_count': row[5]
        })
    
    conn.close()
    return jsonify({'groups': groups})


@app.route('/api/groups', methods=['POST'])
@role_required('admin')
def create_group():
    """Create a new user group."""
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': 'Group name required'}), 400
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO user_groups (name, description, created_by)
            VALUES (?, ?, ?)
        ''', (name, description, current_user.id))
        conn.commit()
        group_id = cursor.lastrowid
        conn.close()
        
        log_activity(current_user.id, 'create_group', 'group', name)

        return jsonify({
            'id': group_id,
            'name': name,
            'description': description,
            'created_at': datetime.utcnow().isoformat(),
            'created_by': current_user.username,
            'member_count': 0
        }), 201
        
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Group name already exists'}), 409


@app.route('/api/groups/<int:group_id>/members', methods=['GET'])
@role_required('admin', 'contributor')
def get_group_members(group_id):
    """Get members of a group."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.id, u.username, u.email, u.role, ugm.added_at
        FROM users u
        JOIN user_group_members ugm ON u.id = ugm.user_id
        WHERE ugm.group_id = ?
    ''', (group_id,))
    
    members = []
    for row in cursor.fetchall():
        members.append({
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'role': row[3],
            'added_at': row[4]
        })
    
    conn.close()
    return jsonify({'members': members})


@app.route('/api/groups/<int:group_id>/members', methods=['POST'])
@role_required('admin')
def add_group_member(group_id):
    """Add user to group."""
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO user_group_members (user_id, group_id, added_by)
            VALUES (?, ?, ?)
        ''', (user_id, group_id, current_user.id))
        conn.commit()
        conn.close()
        
        log_activity(current_user.id, 'add_user_to_group', 'group', str(group_id))
        
        return jsonify({'success': True}), 201
        
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'User already in group'}), 409


@app.route('/api/groups/<int:group_id>/members/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def remove_group_member(group_id, user_id):
    """Remove user from group."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM user_group_members WHERE group_id = ? AND user_id = ?', (group_id, user_id))
    conn.commit()
    conn.close()
    
    log_activity(current_user.id, 'remove_user_from_group', 'group', str(group_id))
    
    return jsonify({'success': True})


@app.route('/api/groups/<int:group_id>/permissions', methods=['GET'])
@role_required('admin')
def get_group_permissions(group_id):
    """Get permissions for a group."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, resource_type, resource_name, permission_level
        FROM group_permissions
        WHERE group_id = ?
    ''', (group_id,))
    
    permissions = []
    for row in cursor.fetchall():
        permissions.append({
            'id': row[0],
            'resource_type': row[1],
            'resource_name': row[2],
            'permission_level': row[3]
        })
    
    conn.close()
    return jsonify({'permissions': permissions})


@app.route('/api/groups/<int:group_id>/permissions', methods=['POST'])
@role_required('admin')
def grant_group_permission(group_id):
    """Grant permission to a group."""
    data = request.get_json()
    resource_type = data.get('resource_type')
    resource_name = data.get('resource_name')
    permission_level = data.get('permission_level', 'read')
    
    if not all([resource_type, resource_name]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO group_permissions (group_id, resource_type, resource_name, permission_level)
        VALUES (?, ?, ?, ?)
    ''', (group_id, resource_type, resource_name, permission_level))
    
    conn.commit()
    permission_id = cursor.lastrowid
    conn.close()
    
    log_activity(current_user.id, 'grant_group_permission', resource_type, resource_name)

    return jsonify({
        'id': permission_id,
        'resource_type': resource_type,
        'resource_name': resource_name,
        'permission_level': permission_level
    }), 201


@app.route('/api/groups/<int:group_id>/permissions/<int:permission_id>', methods=['DELETE'])
@role_required('admin')
def revoke_group_permission(group_id, permission_id):
    """Revoke a group permission."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM group_permissions WHERE id = ? AND group_id = ?', (permission_id, group_id))
    conn.commit()
    conn.close()
    
    log_activity(current_user.id, 'revoke_group_permission', resource_name=str(permission_id))
    
    return jsonify({'success': True})


# ============================================================================
# ============================================================================

@app.route('/api/export/formats', methods=['GET'])
@login_required
def list_export_formats():
    """List all available export formats."""
    return jsonify([
        {'name': exp.name, 'label': exp.label, 'extension': exp.extension}
        for exp in EXPORTERS.values()
    ])


@app.route('/api/export/<format_name>', methods=['POST'])
@export_permission_required
def run_export(format_name):
    """
    Export the data dictionary in the requested format.

    POST body (JSON):
        {
            "type":      "full" | "filtered",   # default: "full"
            "resources": ["schema1", ...]        # optional filter list
        }

    The format_name must match an exporter's `name` attribute.
    Available formats are listed at GET /api/export/formats.
    """
    exporter = EXPORTERS.get(format_name)
    if not exporter:
        available = list(EXPORTERS.keys())
        return jsonify({
            'error': f'Unknown format "{format_name}". Available: {available}'
        }), 404

    body        = request.get_json() or {}
    export_type = body.get('type', 'full')
    resources   = body.get('resources', [])

    try:
        export_data = _build_export_data(current_user, export_type, resources)
        file_bytes  = exporter.export(export_data, current_user, export_type, resources)

        log_activity(current_user.id, f'export_{format_name}', export_type)

        # Log to export_log table
        conn   = sqlite3.connect(app.config['DATABASE'])
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO export_log (user_id, export_type, resources_exported, file_size)
               VALUES (?, ?, ?, ?)''',
            (
                current_user.id,
                export_type,
                ','.join(s['name'] for s in export_data.get('schemas', [])),
                len(file_bytes),
            )
        )
        conn.commit()
        conn.close()

        filename = f'data_dictionary_{datetime.now().strftime("%Y%m%d_%H%M%S")}{exporter.extension}'
        return send_file(
            io.BytesIO(file_bytes),
            mimetype=exporter.mime_type,
            as_attachment=True,
            download_name=filename,
        )

    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500


# Keep /api/export/pdf as a convenience alias so existing clients don't break
@app.route('/api/export/pdf', methods=['POST'])
@export_permission_required
def export_pdf_alias():
    """Backwards-compatible alias → delegates to /api/export/pdf route."""
    from flask import current_app
    with current_app.test_request_context():
        pass
    return run_export('pdf')


@app.route('/api/export/check-permission', methods=['GET'])
@login_required
def check_export_permission():
    """Check if current user can export."""
    return jsonify({
        'can_export': current_user.can_export or current_user.role == 'admin'
    })


# ============================================================================
# API Endpoints - Admin (User & Permission Management)
# ============================================================================

@app.route('/api/admin/users', methods=['GET'])
@role_required('admin')
def get_users():
    """Get all users (admin only)."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, created_at, last_login, is_active, can_export FROM users')
    users = []
    
    for row in cursor.fetchall():
        users.append({
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'role': row[3],
            'created_at': row[4],
            'last_login': row[5],
            'is_active': bool(row[6]),
            'can_export': bool(row[7])
        })
    
    conn.close()
    return jsonify({'users': users})


@app.route('/api/admin/users', methods=['POST'])
@role_required('admin')
def create_user():
    """Create a new user (admin only)."""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'viewer')
    can_export = data.get('can_export', False)
    
    if not all([username, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if role not in ['admin', 'contributor', 'viewer']:
        return jsonify({'error': 'Invalid role'}), 400
    
    password_hash = generate_password_hash(password)
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, can_export)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, password_hash, role, can_export))
        conn.commit()
        user_id = cursor.lastrowid
        
        log_activity(current_user.id, 'create_user', 'user', username)

        conn.close()
        return jsonify({
            'id': user_id,
            'username': username,
            'email': email,
            'role': role,
            'can_export': bool(can_export),
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
        }), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 409


@app.route('/api/admin/users/<int:user_id>', methods=['PATCH'])
@role_required('admin')
def update_user(user_id):
    """Update user properties (admin only)."""
    data = request.get_json()
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Build update query dynamically
    updates = []
    values = []
    
    if 'role' in data:
        updates.append('role = ?')
        values.append(data['role'])
    
    if 'can_export' in data:
        updates.append('can_export = ?')
        values.append(int(data['can_export']))
    
    if 'is_active' in data:
        updates.append('is_active = ?')
        values.append(int(data['is_active']))
    
    if not updates:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(user_id)
    query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
    
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    
    log_activity(current_user.id, 'update_user', 'user', str(user_id))

    # Return the full updated user so the frontend doesn't need a second fetch
    cursor2 = conn.cursor() if False else sqlite3.connect(app.config['DATABASE']).cursor()
    cursor2.execute(
        'SELECT id, username, email, role, created_at, last_login, is_active, can_export FROM users WHERE id = ?',
        (user_id,)
    )
    row = cursor2.fetchone()
    if not row:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': row[0], 'username': row[1], 'email': row[2], 'role': row[3],
        'created_at': row[4], 'last_login': row[5],
        'is_active': bool(row[6]), 'can_export': bool(row[7])
    })


@app.route('/api/admin/users/<int:user_id>/permissions', methods=['GET'])
@role_required('admin')
def get_user_permissions(user_id):
    """Get permissions for a specific user."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, resource_type, resource_name, permission_level
        FROM permissions WHERE user_id = ?
    ''', (user_id,))
    
    permissions = []
    for row in cursor.fetchall():
        permissions.append({
            'id': row[0],
            'resource_type': row[1],
            'resource_name': row[2],
            'permission_level': row[3]
        })
    
    conn.close()
    return jsonify({'permissions': permissions})


@app.route('/api/admin/users/<int:user_id>/permissions', methods=['POST'])
@role_required('admin')
def grant_permission(user_id):
    """Grant permission to a user."""
    data = request.get_json()
    resource_type = data.get('resource_type')
    resource_name = data.get('resource_name')
    permission_level = data.get('permission_level', 'read')
    
    if not all([resource_type, resource_name]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO permissions (user_id, resource_type, resource_name, permission_level)
        VALUES (?, ?, ?, ?)
    ''', (user_id, resource_type, resource_name, permission_level))
    
    conn.commit()
    permission_id = cursor.lastrowid
    conn.close()
    
    log_activity(current_user.id, 'grant_permission', resource_type, resource_name)

    return jsonify({
        'id': permission_id,
        'resource_type': resource_type,
        'resource_name': resource_name,
        'permission_level': permission_level
    }), 201


@app.route('/api/admin/permissions/<int:permission_id>', methods=['DELETE'])
@role_required('admin')
def revoke_permission(permission_id):
    """Revoke a permission."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM permissions WHERE id = ?', (permission_id,))
    conn.commit()
    conn.close()
    
    log_activity(current_user.id, 'revoke_permission', resource_name=str(permission_id))
    
    return jsonify({'success': True})


@app.route('/api/admin/activity', methods=['GET'])
@role_required('admin')
def get_activity_logs():
    """Get recent activity logs with usernames (admin only)."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('''
        SELECT al.id, al.action, al.resource_type, al.resource_name,
               al.ip_address, al.timestamp, u.username
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.timestamp DESC
        LIMIT 500
    ''')
    logs = []
    for row in cursor.fetchall():
        logs.append({
            'id': row[0],
            'action': row[1],
            'resource_type': row[2],
            'resource_name': row[3],
            'ip_address': row[4],
            'timestamp': row[5],
            'username': row[6]
        })
    conn.close()
    return jsonify({'logs': logs})


# ============================================================================
# API Endpoints - Current User Permissions
# ============================================================================

@app.route('/api/me/permissions', methods=['GET'])
@login_required
def get_my_permissions():
    """Get permissions for the currently authenticated user (individual + group)."""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, resource_type, resource_name, permission_level
        FROM permissions WHERE user_id = ?
    ''', (current_user.id,))
    permissions = [
        {'id': r[0], 'resource_type': r[1], 'resource_name': r[2], 'permission_level': r[3]}
        for r in cursor.fetchall()
    ]

    cursor.execute('''
        SELECT gp.id, gp.resource_type, gp.resource_name, gp.permission_level
        FROM group_permissions gp
        JOIN user_group_members ugm ON gp.group_id = ugm.group_id
        WHERE ugm.user_id = ?
    ''', (current_user.id,))
    for r in cursor.fetchall():
        permissions.append({
            'id': r[0], 'resource_type': r[1], 'resource_name': r[2],
            'permission_level': r[3], 'from_group': True
        })

    conn.close()
    is_admin = current_user.role == 'admin'
    return jsonify({'permissions': permissions, 'is_admin': is_admin})


# ============================================================================
# API Endpoints - Analytics
# ============================================================================

@app.route('/api/analytics', methods=['GET'])
@login_required
def get_analytics():
    """Return analytics data for accessible schemas."""
    yaml_data = load_yaml_files()
    schemas_out = []
    all_data_types: Dict[str, int] = {}

    for filename, data in yaml_data.items():
        schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
        if not check_resource_access(current_user.id, 'database', schema_name):
            continue
        if not data or 'models' not in data:
            continue

        tables = []
        schema_col_count = 0
        for model in data.get('models', []):
            cols = model.get('columns', [])
            col_count = len(cols)
            schema_col_count += col_count
            tables.append({
                'name': model.get('name', ''),
                'column_count': col_count,
                'description': model.get('description', '') or '',
            })
            for col in cols:
                dtype = (col.get('data_type') or 'unknown').lower()
                if 'int' in dtype:
                    key = 'integer'
                elif any(x in dtype for x in ('varchar', 'char', 'text', 'string')):
                    key = 'string'
                elif any(x in dtype for x in ('timestamp', 'date', 'time')):
                    key = 'datetime'
                elif 'bool' in dtype:
                    key = 'boolean'
                elif any(x in dtype for x in ('float', 'double', 'decimal', 'numeric', 'number')):
                    key = 'numeric'
                else:
                    key = dtype if dtype else 'unknown'
                all_data_types[key] = all_data_types.get(key, 0) + 1

        schemas_out.append({
            'name': schema_name,
            'table_count': len(tables),
            'column_count': schema_col_count,
            'tables': sorted(tables, key=lambda t: t['column_count'], reverse=True),
        })

    schemas_out.sort(key=lambda s: s['table_count'], reverse=True)
    return jsonify({
        'schemas': schemas_out,
        'data_types': all_data_types,
        'totals': {
            'schemas': len(schemas_out),
            'tables': sum(s['table_count'] for s in schemas_out),
            'columns': sum(s['column_count'] for s in schemas_out),
        },
    })


# ============================================================================
# API Endpoints - Metadata Editing
# ============================================================================

def _check_write_access(schema: str, table: str = None) -> bool:
    """Return True if the current user has write permission for schema/table."""
    if current_user.role == 'admin':
        return True
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    resource_names = [schema]
    if table:
        resource_names.extend([table, f'{schema}.{table}'])
    placeholders = ','.join(['?' for _ in resource_names])
    cursor.execute(
        f"SELECT id FROM permissions WHERE user_id = ? AND permission_level = 'write' AND resource_name IN ({placeholders})",
        [current_user.id] + resource_names,
    )
    if cursor.fetchone():
        conn.close()
        return True
    cursor.execute(
        f'''SELECT gp.id FROM group_permissions gp
            JOIN user_group_members ugm ON gp.group_id = ugm.group_id
            WHERE ugm.user_id = ? AND gp.permission_level = 'write'
            AND gp.resource_name IN ({placeholders})''',
        [current_user.id] + resource_names,
    )
    result = cursor.fetchone()
    conn.close()
    return result is not None


def _find_yaml_file(schema: str):
    """Return the absolute path of the YAML file for the given schema, or None."""
    yaml_dir = app.config['YAML_DIRECTORY']
    if not os.path.exists(yaml_dir):
        return None
    for filename in os.listdir(yaml_dir):
        if filename.endswith(('.yml', '.yaml')):
            schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
            if schema_name == schema:
                return os.path.join(yaml_dir, filename)
    return None


@app.route('/api/schemas/<schema>/tables/<table>', methods=['PATCH'])
@login_required
def update_table_description(schema, table):
    """Update a table's description. Requires write permission on the schema or table."""
    if not _check_write_access(schema, table):
        return jsonify({'error': 'Write permission required'}), 403

    data = request.get_json()
    new_description = data.get('description', '')

    filepath = _find_yaml_file(schema)
    if not filepath:
        return jsonify({'error': 'Schema not found'}), 404

    with open(filepath, 'r', encoding='utf-8') as f:
        content = yaml.safe_load(f)

    if not content or 'models' not in content:
        return jsonify({'error': 'Invalid YAML structure'}), 400

    updated = False
    for model in content['models']:
        if model.get('name') == table:
            model['description'] = new_description
            updated = True
            break

    if not updated:
        return jsonify({'error': 'Table not found'}), 404

    with open(filepath, 'w', encoding='utf-8') as f:
        yaml.dump(content, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    log_activity(current_user.id, 'edit_table', 'table', f'{schema}.{table}')
    return jsonify({'success': True, 'description': new_description})


@app.route('/api/schemas/<schema>/tables/<table>/columns/<column>', methods=['PATCH'])
@login_required
def update_column_description(schema, table, column):
    """Update a column's description. Requires write permission on the schema or table."""
    if not _check_write_access(schema, table):
        return jsonify({'error': 'Write permission required'}), 403

    data = request.get_json()
    new_description = data.get('description', '')

    filepath = _find_yaml_file(schema)
    if not filepath:
        return jsonify({'error': 'Schema not found'}), 404

    with open(filepath, 'r', encoding='utf-8') as f:
        content = yaml.safe_load(f)

    if not content or 'models' not in content:
        return jsonify({'error': 'Invalid YAML structure'}), 400

    updated = False
    for model in content['models']:
        if model.get('name') == table:
            for col in model.get('columns', []):
                if col.get('name') == column:
                    col['description'] = new_description
                    updated = True
                    break
            break

    if not updated:
        return jsonify({'error': 'Column not found'}), 404

    with open(filepath, 'w', encoding='utf-8') as f:
        yaml.dump(content, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    log_activity(current_user.id, 'edit_column', 'column', f'{schema}.{table}.{column}')
    return jsonify({'success': True, 'description': new_description})


# ============================================================================
# API Endpoints - File Directory (Admin only)
# ============================================================================

@app.route('/api/admin/files', methods=['GET'])
@role_required('admin')
def get_files():
    """Return the current YAML directory and a listing of its schema files."""
    yaml_dir = app.config['YAML_DIRECTORY']
    exists = os.path.exists(yaml_dir) and os.path.isdir(yaml_dir)
    files = []

    if exists:
        for filename in sorted(os.listdir(yaml_dir)):
            if not filename.endswith(('.yml', '.yaml')):
                continue
            filepath = os.path.join(yaml_dir, filename)
            stat = os.stat(filepath)
            schema_name = filename.replace('schema_', '').replace('.yml', '').replace('.yaml', '')
            table_count = 0
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    fdata = yaml.safe_load(f)
                    if fdata and 'models' in fdata:
                        table_count = len(fdata['models'])
            except Exception:
                pass
            files.append({
                'name': filename,
                'schema_name': schema_name,
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'table_count': table_count,
            })

    return jsonify({'directory': yaml_dir, 'exists': exists, 'files': files})


@app.route('/api/admin/files/directory', methods=['POST'])
@role_required('admin')
def set_files_directory():
    """Change the YAML directory path used to populate schema data."""
    data = request.get_json()
    new_dir = (data.get('directory') or '').strip()

    if not new_dir:
        return jsonify({'error': 'Directory path is required'}), 400
    if not os.path.exists(new_dir):
        return jsonify({'error': f'Directory does not exist: {new_dir}'}), 400
    if not os.path.isdir(new_dir):
        return jsonify({'error': 'Path must be a directory'}), 400

    app.config['YAML_DIRECTORY'] = new_dir

    # Persist to .env file if present
    env_path = '.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            lines = f.readlines()
        updated = False
        for i, line in enumerate(lines):
            if line.startswith('YAML_DIRECTORY='):
                lines[i] = f'YAML_DIRECTORY={new_dir}\n'
                updated = True
                break
        if not updated:
            lines.append(f'YAML_DIRECTORY={new_dir}\n')
        with open(env_path, 'w') as f:
            f.writelines(lines)

    log_activity(current_user.id, 'change_yaml_directory', 'config', new_dir)
    return jsonify({'success': True, 'directory': new_dir, 'message': f'YAML directory changed to {new_dir}'})


# ============================================================================
# React SPA Routes — serve the built frontend for all non-API paths
# ============================================================================

REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), 'static', 'dist')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path: str):
    """Serve the React SPA. Static assets are served directly; all other
    paths fall back to index.html so React Router handles client-side routing."""
    if path and os.path.exists(os.path.join(REACT_BUILD_DIR, path)):
        return send_from_directory(REACT_BUILD_DIR, path)
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5002)
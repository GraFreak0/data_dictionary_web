#!/usr/bin/env python3
"""
Quick Start Script for Data Dictionary Web UI
Helps users set up the application quickly.
"""

import os
import sys
import subprocess

def print_banner():
    """Print welcome banner."""
    print("=" * 70)
    print("📚 Data Dictionary Web UI - Quick Start")
    print("=" * 70)
    print()

def check_python_version():
    """Check Python version."""
    print("✓ Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("✗ Python 3.8+ required!")
        print(f"  Current version: {version.major}.{version.minor}.{version.micro}")
        sys.exit(1)
    print(f"  Python {version.major}.{version.minor}.{version.micro} ✓")
    print()

def install_dependencies():
    """Install required packages."""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ Dependencies installed")
        print()
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        sys.exit(1)

def setup_config():
    """Set up configuration."""
    print("⚙️  Configuration Setup")
    print("-" * 70)
    
    yaml_dir = input("Enter path to your YAML files (default: ./dbt_models): ").strip()
    if not yaml_dir:
        yaml_dir = './dbt_models'
    
    # Check if directory exists
    if not os.path.exists(yaml_dir):
        create = input(f"Directory '{yaml_dir}' doesn't exist. Create it? (y/n): ").lower()
        if create == 'y':
            os.makedirs(yaml_dir, exist_ok=True)
            print(f"✓ Created directory: {yaml_dir}")
        else:
            print("⚠️  Warning: YAML directory doesn't exist. App may not find files.")
    
    # Update app.py with YAML directory
    update_app_config(yaml_dir)
    
    print()
    print(f"✓ Configuration complete")
    print(f"  YAML Directory: {yaml_dir}")
    print()

def update_app_config(yaml_dir):
    """Update YAML_DIRECTORY in app.py."""
    try:
        with open('app.py', 'r') as f:
            content = f.read()
        
        # Replace YAML_DIRECTORY line
        content = content.replace(
            "app.config['YAML_DIRECTORY'] = './dbt_models'",
            f"app.config['YAML_DIRECTORY'] = '{yaml_dir}'"
        )
        
        with open('app.py', 'w') as f:
            f.write(content)
        
        print(f"  Updated app.py with YAML directory")
    except Exception as e:
        print(f"  Warning: Could not update app.py automatically: {e}")
        print(f"  Please manually set YAML_DIRECTORY = '{yaml_dir}' in app.py")

def create_env_file():
    """Create .env file for security."""
    if os.path.exists('.env'):
        print("✓ .env file already exists")
        return
    
    print("🔐 Creating .env file for security settings...")
    
    env_content = """# Data Dictionary Web UI - Environment Variables
# IMPORTANT: Change these values in production!

SECRET_KEY=change-this-to-a-random-secret-key
JWT_SECRET_KEY=change-this-to-another-random-secret
YAML_DIRECTORY=./dbt_models
DATABASE_PATH=./data_dictionary.db
FLASK_ENV=development
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✓ Created .env file")
    print("  ⚠️  Remember to change SECRET_KEY and JWT_SECRET_KEY in production!")
    print()

def initialize_database():
    """Initialize the database."""
    print("🗄️  Initializing database...")
    try:
        # Import and run init_db
        from app import init_db
        init_db()
        print("✓ Database initialized")
        print("  Default admin user created:")
        print("    Username: admin")
        print("    Password: admin123")
        print("    ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
        print()
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")
        sys.exit(1)

def print_next_steps():
    """Print next steps."""
    print("=" * 70)
    print("🎉 Setup Complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print()
    print("1. Start the application:")
    print("   python app.py")
    print()
    print("2. Open your browser:")
    print("   http://localhost:5000")
    print()
    print("3. Login with:")
    print("   Username: admin")
    print("   Password: admin123")
    print()
    print("4. IMPORTANT: Change admin password immediately!")
    print()
    print("5. Add your YAML files to:", end=" ")
    # Read YAML_DIRECTORY from app.py
    try:
        with open('app.py', 'r') as f:
            for line in f:
                if "YAML_DIRECTORY" in line and "=" in line:
                    yaml_dir = line.split("=")[1].strip().strip("'\"")
                    print(yaml_dir)
                    break
    except:
        print("./dbt_models")
    print()
    print("6. Create users and assign permissions via Admin Panel")
    print()
    print("📚 Read COMPLETE_GUIDE.md for detailed documentation")
    print("=" * 70)

def main():
    """Main setup flow."""
    print_banner()
    
    # Check Python version
    check_python_version()
    
    # Install dependencies
    try:
        install_dependencies()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled.")
        sys.exit(0)
    
    # Setup configuration
    try:
        setup_config()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled.")
        sys.exit(0)
    
    # Create .env file
    create_env_file()
    
    # Initialize database
    initialize_database()
    
    # Print next steps
    print_next_steps()

if __name__ == '__main__':
    main()

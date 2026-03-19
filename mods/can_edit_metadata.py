"""
Migration: Add Metadata Edit Permissions
=========================================
Run this once to add the new can_edit_metadata permission system.

Usage:
    python migration_add_edit_permissions.py
"""

import sqlite3
import os

DATABASE = os.getenv('DATABASE', './data_dictionary.db')

def migrate():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    print("Starting migration...")
    
    # 1. Add can_edit_metadata column to users table
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN can_edit_metadata BOOLEAN DEFAULT 0')
        print("✓ Added can_edit_metadata column to users table")
    except sqlite3.OperationalError as e:
        if 'duplicate column' in str(e).lower():
            print("⚠ can_edit_metadata column already exists")
        else:
            raise
    
    # 2. Create metadata_edits audit log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata_edits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            schema_name TEXT NOT NULL,
            table_name TEXT NOT NULL,
            column_name TEXT,
            field_changed TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    print("✓ Created metadata_edits table")
    
    # 3. Grant edit permission to admin by default
    cursor.execute('''
        UPDATE users 
        SET can_edit_metadata = 1 
        WHERE role = 'admin'
    ''')
    affected = cursor.rowcount
    print(f"✓ Granted edit permission to {affected} admin user(s)")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration completed successfully!")
    print("\nNext steps:")
    print("  1. Restart your Flask app")
    print("  2. Edit permissions will now appear in the admin panel")
    print("  3. Users/groups with can_edit_metadata=True can edit YAML files")

if __name__ == '__main__':
    migrate()
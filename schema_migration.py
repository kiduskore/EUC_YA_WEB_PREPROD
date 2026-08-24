import sqlite3
import psycopg2
import os

DATABASE_URL = os.environ.get('DATABASE_URL')
IS_POSTGRES = DATABASE_URL and DATABASE_URL.startswith('postgres')

def get_connection():
    if IS_POSTGRES:
        print(f"Connecting to PostgreSQL...")
        return psycopg2.connect(DATABASE_URL)
    else:
        print(f"Connecting to SQLite...")
        return sqlite3.connect('euc_ya.db')

def run_migration():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Create Roles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
    )
    """)
    
    # 2. Create Permissions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
    )
    """)
    
    # 3. Create Role_Permissions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER,
        permission_id INTEGER,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
    )
    """)
    
    # 4. Create Users Table
    # For Postgres, id SERIAL PRIMARY KEY; for SQLite, id INTEGER PRIMARY KEY
    if IS_POSTGRES:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        )
        """)
    else:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role_id INTEGER,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        )
        """)
        
    conn.commit()
    print("Tables created successfully.")
    
    # Seed Data
    try:
        # Seed Roles
        cursor.execute("INSERT INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Basic Manager') ON CONFLICT DO NOTHING")
        
        # Seed Permissions
        permissions = [
            (1, 'manage_users'),
            (2, 'manage_pods'),
            (3, 'manage_members'),
            (4, 'manage_settings'),
            (5, 'view_dashboard')
        ]
        if IS_POSTGRES:
            from psycopg2.extras import execute_batch
            execute_batch(cursor, "INSERT INTO permissions (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING", permissions)
        else:
            cursor.executemany("INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)", permissions)
            
        # Seed Role Permissions
        # Admin gets everything
        admin_perms = [(1, p_id) for p_id in range(1, 6)]
        # Basic Manager gets view_dashboard (5), manage_members (3), manage_pods (2)
        basic_perms = [(2, 5), (2, 3), (2, 2)]
        
        if IS_POSTGRES:
            execute_batch(cursor, "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", admin_perms + basic_perms)
        else:
            cursor.executemany("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", admin_perms + basic_perms)
            
        conn.commit()
        print("Seed data inserted successfully.")
    except Exception as e:
        print(f"Error seeding data: {e}")
        conn.rollback()
        
    conn.close()

if __name__ == "__main__":
    run_migration()

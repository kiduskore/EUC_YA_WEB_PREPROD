import sqlite3
import psycopg2
import os
from werkzeug.security import generate_password_hash

DATABASE_URL = os.environ.get('DATABASE_URL')
IS_POSTGRES = DATABASE_URL and DATABASE_URL.startswith('postgres')

def get_connection():
    if IS_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    else:
        return sqlite3.connect('euc_ya.db')

def bootstrap():
    conn = get_connection()
    cursor = conn.cursor()
    
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    full_name = input("Enter full name (optional): ")
    
    hashed = generate_password_hash(password)
    
    try:
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO users (email, password_hash, full_name, role_id, is_active)
                VALUES (%s, %s, %s, 1, TRUE)
                ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            """, (email, hashed, full_name))
        else:
            cursor.execute("""
                INSERT INTO users (email, password_hash, full_name, role_id, is_active)
                VALUES (?, ?, ?, 1, 1)
                ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash
            """, (email, hashed, full_name))
            
        conn.commit()
        print(f"Admin user {email} created successfully!")
    except Exception as e:
        print(f"Error creating admin: {e}")
        conn.rollback()
        
    conn.close()

if __name__ == "__main__":
    # If run in non-interactive mode (e.g. CI), provide defaults or environment vars
    if os.environ.get('BOOTSTRAP_ADMIN_EMAIL'):
        email = os.environ.get('BOOTSTRAP_ADMIN_EMAIL')
        password = os.environ.get('BOOTSTRAP_ADMIN_PASSWORD')
        full_name = "Super Admin"
        hashed = generate_password_hash(password)
        conn = get_connection()
        cursor = conn.cursor()
        if IS_POSTGRES:
            cursor.execute("INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (%s, %s, %s, 1, TRUE) ON CONFLICT (email) DO NOTHING", (email, hashed, full_name))
        else:
            cursor.execute("INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, 1, 1) ON CONFLICT (email) DO NOTHING", (email, hashed, full_name))
        conn.commit()
        conn.close()
        print("Admin user created from environment variables.")
    else:
        bootstrap()

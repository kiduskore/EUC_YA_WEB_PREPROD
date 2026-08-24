from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.db.database import get_db
from app.config import Config
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)
IS_POSTGRES = Config.IS_POSTGRES

def setup():
    try:
        db = get_db()
        c = db.cursor()
        
        try:
            c.execute("SELECT COUNT(*) FROM users")
            user_count = c.fetchone()[0]
        except Exception as e:
            print("Users table not found, initializing db...", e)
            # Rollback the failed transaction
            db._conn.rollback()
            
            # Auto-initialize tables
            if IS_POSTGRES:
                c.execute("""
                    CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
                    CREATE TABLE IF NOT EXISTS permissions (id INTEGER PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);
                    CREATE TABLE IF NOT EXISTS role_permissions (role_id INTEGER, permission_id INTEGER, PRIMARY KEY (role_id, permission_id));
                    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(100), role_id INTEGER, is_active BOOLEAN DEFAULT TRUE);
                    CREATE TABLE IF NOT EXISTS invite_codes (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, role_id INTEGER, is_used BOOLEAN DEFAULT FALSE, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
                """)
            else:
                c.execute("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL)")
                c.execute("CREATE TABLE IF NOT EXISTS permissions (id INTEGER PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL)")
                c.execute("CREATE TABLE IF NOT EXISTS role_permissions (role_id INTEGER, permission_id INTEGER, PRIMARY KEY (role_id, permission_id))")
                c.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(100), role_id INTEGER, is_active BOOLEAN DEFAULT 1)")
                c.execute("CREATE TABLE IF NOT EXISTS invite_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, code VARCHAR(50) UNIQUE NOT NULL, role_id INTEGER, is_used BOOLEAN DEFAULT 0, created_by INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
            
            # Seed roles and permissions
            c.execute("INSERT INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Basic Manager') ON CONFLICT DO NOTHING" if IS_POSTGRES else "INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Basic Manager')")
            permissions = [(1, 'manage_users'), (2, 'manage_pods'), (3, 'manage_members'), (4, 'manage_settings'), (5, 'view_dashboard')]
            for p in permissions:
                c.execute("INSERT INTO permissions (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING" if IS_POSTGRES else "INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)", p)
                
            admin_perms = [(1, p_id) for p_id in range(1, 6)]
            basic_perms = [(2, 5), (2, 3), (2, 2)]
            for rp in admin_perms + basic_perms:
                c.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING" if IS_POSTGRES else "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", rp)
                
            db.commit()
            user_count = 0
            
        if user_count > 0:
            return redirect(url_for('auth.login')) # Only allow setup if NO users exist
            
        if request.method == 'POST':
            email = request.form.get('email', '').strip().lower()
            pwd = request.form.get('password')
            full_name = request.form.get('full_name')
            if email and pwd:
                hashed = generate_password_hash(pwd)
                q = "INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (%s, %s, %s, 1, TRUE) RETURNING id" if IS_POSTGRES else "INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, 1, 1)"
                c.execute(q, (email, hashed, full_name))
                db.commit()
                
                if not IS_POSTGRES:
                    user_id = c.lastrowid
                else:
                    user_id = c.fetchone()['id'] if isinstance(c.fetchone(), dict) else getattr(c.fetchone(), 'id', c.lastrowid)
                    # Safe fallback
                    q2 = "SELECT id FROM users WHERE email = %s"
                    c.execute(q2, (email,))
                    row = c.fetchone()
                    user_id = row['id'] if isinstance(row, dict) else row[0]
                    
                session['user_id'] = user_id
                session['role'] = 'leader'
                return redirect(url_for('views.dashboard'))
                
        return render_template('setup.html')
    except Exception as outer_e:
        import traceback
        return f"<h1>Fatal Error in /setup:</h1><pre>{traceback.format_exc()}</pre>"

def login():
    error = None
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        pwd = request.form.get('password')
                    
        if email and pwd:
            db = get_db()
            c = db.cursor()
            q = "SELECT id, password_hash, role_id, full_name FROM users WHERE email = %s AND is_active = TRUE" if IS_POSTGRES else "SELECT id, password_hash, role_id, full_name FROM users WHERE email = ? AND is_active = 1"
            c.execute(q, (email,))
            user = c.fetchone()
            
            if user and check_password_hash(user['password_hash'] if type(user) is dict else user[1], pwd):
                session['user_id'] = user['id'] if type(user) is dict else user[0]
                session['role'] = 'leader'
                return redirect(url_for('views.dashboard'))
            else:
                error = "Invalid email or password."
        else:
            error = "Email and password are required."
            
    return render_template('login.html', error=error)

def claim_account():
    error = None
    if session.get('user_id'):
        return redirect(url_for('views.dashboard'))
        
    if request.method == 'POST':
        invite_code = request.form.get('invite_code')
        email = request.form.get('email', '').strip().lower()
        pwd = request.form.get('password')
        full_name = request.form.get('full_name')
        
        if invite_code and email and pwd:
            db = get_db()
            c = db.cursor()
            
            # Check DB invite code
            q = "SELECT id, role_id, is_used FROM invite_codes WHERE code = %s" if IS_POSTGRES else "SELECT id, role_id, is_used FROM invite_codes WHERE code = ?"
            c.execute(q, (invite_code,))
            code_record = c.fetchone()
            
            if not code_record or (type(code_record) is dict and code_record['is_used']) or (type(code_record) is tuple and code_record[2]):
                return render_template('claim_account.html', error="Invalid or already used invite code.")
            role_id = code_record['role_id'] if type(code_record) is dict else code_record[1]
                
            hashed = generate_password_hash(pwd)
            try:
                q = "INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (%s, %s, %s, %s, TRUE) RETURNING id" if IS_POSTGRES else "INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, ?, 1)"
                c.execute(q, (email, hashed, full_name, role_id))
                
                user_id = c.lastrowid
                if IS_POSTGRES and not user_id:
                    c.execute("SELECT id FROM users WHERE email = %s ORDER BY id DESC LIMIT 1", (email,))
                    row = c.fetchone()
                    user_id = row['id'] if isinstance(row, dict) else row[0]
                
                # Mark invite as used
                uq = "UPDATE invite_codes SET is_used = TRUE WHERE code = %s" if IS_POSTGRES else "UPDATE invite_codes SET is_used = 1 WHERE code = ?"
                c.execute(uq, (invite_code,))
                    
                db.commit()
                
                session['user_id'] = user_id
                session['role'] = 'leader'
                return redirect(url_for('views.dashboard'))
            except Exception as e:
                error = "Email already in use or error creating account."
        else:
            error = "All fields are required."
            
    return render_template('claim_account.html', error=error)

def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None)
    session.pop('role', None)
    return redirect(url_for('auth.login'))


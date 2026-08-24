import sqlite3
import json
import urllib.request
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, render_template, request, jsonify, g, session, redirect, url_for
from functools import wraps
from datetime import datetime

from app.utils.validation import validate_schema
from app.utils.schemas import MemberCreateSchema, PodCreateSchema, WeeklyPlanCreateSchema

app = Flask(__name__)
app.secret_key = 'euc_super_secret_key_2026'

@app.before_request
def check_csrf():
    if request.method in ['POST', 'PUT', 'DELETE']:
        if request.endpoint in ['login', 'claim_account', 'create_prayer', 'create_newcomer', 'log_attendance']:
            return
        token = request.headers.get('X-CSRF-Token')
        if not token or token != session.get('csrf_token'):
            return jsonify({'error': 'CSRF token missing or invalid'}), 403

@app.after_request
def add_security_headers(response):
    if 'csrf_token' not in session:
        import uuid
        session['csrf_token'] = str(uuid.uuid4())
    response.set_cookie('csrf_token', session['csrf_token'], secure=True, samesite='Lax')
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;"
    response.headers['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
    # Also add COOP and COEP for Origin Isolation
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    # Adding require-trusted-types-for to mitigate DOM XSS
    # Trusted Types omitted to prevent breaking Vue
    return response

app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

DATABASE = 'euc_ya.db'

from werkzeug.security import generate_password_hash, check_password_hash

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            # Allow legacy fallback for a short transition period
            if session.get('logged_in'):
                return f(*args, **kwargs)
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def leader_required(f):
    return login_required(f)

def permission_required(permission_name):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                return jsonify({'error': 'Unauthorized'}), 401
            db = get_db()
            c = db.cursor()
            q = """
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON u.role_id = rp.role_id
                WHERE u.id = %s
            """ if IS_POSTGRES else """
                SELECT p.name 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON u.role_id = rp.role_id
                WHERE u.id = ?
            """
            c.execute(q, (session['user_id'],))
            perms = [row[0] for row in c.fetchall()]
            if permission_name not in perms:
                return jsonify({'error': 'Forbidden: Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator



DATABASE_URL = os.environ.get('DATABASE_URL')
IS_POSTGRES = DATABASE_URL is not None


class CursorWrapper:
    def __init__(self, cursor, is_postgres):
        self._cursor = cursor
        self.is_postgres = is_postgres
        self.lastrowid = None
        self.rowcount = 0

    def _convert_query(self, query):
        if not self.is_postgres:
            return query
        query = query.replace('?', '%s')
        query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        query = query.replace("DEFAULT (date('now'))", "DEFAULT CURRENT_DATE")
        query = query.replace("strftime('%Y-%m', join_date)", "to_char(join_date::timestamp, 'YYYY-MM')")
        query = query.replace("BOOLEAN DEFAULT 1", "BOOLEAN DEFAULT true")
        query = query.replace("BOOLEAN DEFAULT 0", "BOOLEAN DEFAULT false")
        query = query.replace('is_active=1', 'is_active=true')
        query = query.replace('present=1', 'present=true')
        return query

    def execute(self, query, params=()):
        q = self._convert_query(query)
        is_insert = q.strip().upper().startswith('INSERT')
        
        if self.is_postgres and is_insert and 'RETURNING ' not in q.upper():
            # Don't append RETURNING id for tables without an id column
            if 'role_permissions' not in q.lower() and 'ON CONFLICT DO NOTHING' not in q.upper():
                q = q.rstrip(';') + ' RETURNING id'
            
        self._cursor.execute(q, params)
        self.rowcount = self._cursor.rowcount
        
        if is_insert:
            if self.is_postgres:
                try:
                    self.lastrowid = self._cursor.fetchone()[0]
                except:
                    pass
            else:
                self.lastrowid = self._cursor.lastrowid

    def executemany(self, query, params_list):
        q = self._convert_query(query)
        if self.is_postgres:
            for p in params_list:
                self._cursor.execute(q, p)
        else:
            self._cursor.executemany(q, params_list)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        self._cursor.close()

class ConnWrapper:
    def __init__(self, conn, is_postgres):
        self._conn = conn
        self.is_postgres = is_postgres

    def cursor(self):
        if self.is_postgres:
            from psycopg2.extras import DictCursor
            c = self._conn.cursor(cursor_factory=DictCursor)
        else:
            c = self._conn.cursor()
        return CursorWrapper(c, self.is_postgres)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        if IS_POSTGRES:
            conn = psycopg2.connect(DATABASE_URL)
            db = g._database = ConnWrapper(conn, True)
        else:
            conn = sqlite3.connect(DATABASE_URL or 'euc_ya.db')
            conn.row_factory = sqlite3.Row
            db = g._database = ConnWrapper(conn, False)
    return db



    lastrowid = None
    if executemany:
        if IS_POSTGRES:
            from psycopg2.extras import execute_batch
            execute_batch(cursor, query, params)
        else:
            cursor.executemany(query, params)
    else:
        cursor.execute(query, params)
        if is_insert:
            if IS_POSTGRES:
                try:
                    lastrowid = cursor.fetchone()['id']
                except:
                    pass
            else:
                lastrowid = cursor.lastrowid
                
    res = None
    if fetchall:
        res = [dict(row) for row in cursor.fetchall()]
    elif fetchone:
        row = cursor.fetchone()
        res = dict(row) if row else None
        
    if commit:
        db.commit()
    cursor.close()
    
    if fetchall or fetchone:
        return res
    return lastrowid


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            join_date TEXT DEFAULT (date('now')),
            role TEXT DEFAULT 'member',
            spiritual_stage TEXT DEFAULT 'new',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS pods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            leader_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (leader_id) REFERENCES members(id)
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS pod_members (
            pod_id INTEGER,
            member_id INTEGER,
            joined_at TEXT DEFAULT (date('now')),
            PRIMARY KEY (pod_id, member_id)
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER,
            pod_id INTEGER,
            date TEXT,
            present BOOLEAN DEFAULT 1
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS weekly_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pod_id INTEGER,
            leader_id INTEGER,
            week_date TEXT,
            bible_passage TEXT,
            discussion_questions TEXT,
            spiritual_goals TEXT,
            post_meeting_notes TEXT,
            members_struggling TEXT,
            members_ready_to_lead TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS prayer_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER,
            requester_name TEXT,
            request_text TEXT NOT NULL,
            is_urgent BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'active',
            testimony TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            answered_at TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS prayer_supporters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER,
            member_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS newcomer_pipeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            stage TEXT DEFAULT 'first_contact',
            notes TEXT,
            assigned_to INTEGER,
            first_visit_date TEXT DEFAULT (date('now')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS devotionals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER,
            week_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        
        # Seed initial resources if empty
        cursor.execute('SELECT COUNT(*) FROM resources')
        if cursor.fetchone()[0] == 0:
            seed_resources = [
                ("How to Read the Bible for All Its Worth", "A foundational guide to understanding and interpreting Scripture effectively.", "Bible Study", "https://bibleproject.com/explore/how-to-read-the-bible/"),
                ("Gospel of John Study Guide", "A 12-week deep dive into the Gospel of John focusing on the identity of Jesus.", "Bible Study", "https://www.thegospelcoalition.org/course/knowing-bible-john/"),
                ("The Master Plan of Evangelism", "Robert Coleman's classic on how Jesus made disciples and how we can follow His model.", "Leadership", "https://discipleship.org/wp-content/uploads/2018/01/Master-Plan-of-Evangelism.pdf"),
                ("Spiritual Leadership", "J. Oswald Sanders' essential principles for guiding others through spiritual maturity.", "Leadership", "https://www.desiringgod.org/books/spiritual-leadership"),
                ("DNA Pod Leader Guide", "Internal guide on how to facilitate effective DNA pods, navigate difficult conversations, and multiply leaders.", "Leadership", "#"),
                ("New Morning Mercies", "Daily gospel-centered devotionals by Paul David Tripp.", "Devotional", "https://www.paultripp.com/new-morning-mercies"),
                ("Praying the Bible", "Donald Whitney's guide on how to use Scripture to guide your daily prayer life.", "Devotional", "https://www.crossway.org/books/praying-the-bible-tpb/")
            ]
            cursor.executemany('INSERT INTO resources (title, description, category, file_url) VALUES (?, ?, ?, ?)', seed_resources)
            
        # Safe migration: add requester_name column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE prayer_requests ADD COLUMN requester_name TEXT")
            db.commit()
        except Exception:
            db.rollback()

        db.commit()

init_db()


@app.route('/salvation')
def salvation_page():
    return render_template('salvation.html')

@app.route('/water-baptism')
def water_baptism_page():
    return render_template('water-baptism.html')

@app.route('/kingdom')
def kingdom_page():
    return render_template('kingdom.html')

@app.route('/membership')
def membership_page():
    return render_template('membership.html')

@app.route('/community')
def community_page():
    return render_template('community.html')

@app.route('/mentorship')
def mentorship_page():
    return render_template('mentorship.html')

@app.route('/scripture-memory')
def scripture_memory_page():
    return render_template('scripture-memory.html')

@app.route('/growth')
def growth_page():
    return render_template('growth.html')

@app.route('/maturity')
def maturity_page():
    return render_template('maturity.html')

@app.route('/availability')
def availability_page():
    return render_template('availability.html')

@app.route('/serving')
def serving_page():
    return render_template('serving.html')

@app.route('/generosity')
def generosity_page():
    return render_template('generosity.html')

@app.route('/')
def index():
    return render_template('landing.html')




import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import uuid

def send_invite_email(to_email, name, code):
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.ionos.com')
    smtp_port = os.environ.get('SMTP_PORT', 587)
    smtp_user = os.environ.get('SMTP_USER', 'info@eucmaryland.org')
    smtp_pass = os.environ.get('SMTP_PASS', 'Cloud@2026Secure#')
    
    if not all([smtp_server, smtp_user, smtp_pass]):
        print(f"\n--- EMAIL NOT SENT (Missing SMTP config) ---")
        print(f"To: {to_email}")
        print(f"Code: {code}")
        print(f"Link: https://youngadults.eucmaryland.org/claim-account?code={code}")
        print(f"--------------------------------------------\n")
        return False
        
    def send_async():
        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = to_email
            msg['Subject'] = "You've been invited to the EUC Leaders Dashboard!"
            
            body = f"""Hello {name},
            
You have been granted leader access to the EUC Young Adults Dashboard.
Please activate your account by clicking the link below:

https://youngadults.eucmaryland.org/claim-account?code={code}

Alternatively, go to youngadults.eucmaryland.org/claim-account and enter the invite code: {code}

Blessings,
EUC Leadership Team"""
            
            msg.attach(MIMEText(body, 'plain'))
            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print("Failed to send email:", e)
            
    threading.Thread(target=send_async).start()
    return True

@app.route('/api/members/<int:id>/send-invite', methods=['POST'])
@permission_required('manage_settings')
def trigger_member_invite(id):
    db = get_db()
    c = db.cursor()
    c.execute("SELECT name, email, role FROM members WHERE id = %s" if IS_POSTGRES else "SELECT name, email, role FROM members WHERE id = ?", (id,))
    member = c.fetchone()
    
    if not member:
        return jsonify({"error": "Member not found"}), 404
        
    m_name = member['name'] if type(member) is dict else member[0]
    m_email = member['email'] if type(member) is dict else member[1]
    
    if not m_email:
        return jsonify({"error": "Member has no email address"}), 400
        
    import uuid
    # Generate code
    code = str(uuid.uuid4()).split('-')[0].upper()
    role_id = 2 # Basic Manager
    
    q = "INSERT INTO invite_codes (code, role_id, created_by) VALUES (%s, %s, %s)" if IS_POSTGRES else "INSERT INTO invite_codes (code, role_id, created_by) VALUES (?, ?, ?)"
    c.execute(q, (code, role_id, session['user_id']))
    db.commit()
    
    # Send email
    sent = send_invite_email(m_email, m_name, code)
    return jsonify({"success": True, "code": code, "email_sent": sent})

@app.route('/api/system/init', methods=['GET'])
def system_init():
    db = get_db()
    c = db.cursor()
    # Create users, roles, etc if not exists (fail-safe if they didn't run schema_migration.py)
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
    c.execute("INSERT INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Basic Manager') ON CONFLICT DO NOTHING")
    permissions = [(1, 'manage_users'), (2, 'manage_pods'), (3, 'manage_members'), (4, 'manage_settings'), (5, 'view_dashboard')]
    for p in permissions:
        c.execute("INSERT INTO permissions (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING" if IS_POSTGRES else "INSERT OR IGNORE INTO permissions (id, name) VALUES (?, ?)", p)
        
    admin_perms = [(1, p_id) for p_id in range(1, 6)]
    basic_perms = [(2, 5), (2, 3), (2, 2)]
    for rp in admin_perms + basic_perms:
        c.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING" if IS_POSTGRES else "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", rp)
        
    db.commit()
    return "DB Initialized"

@app.route('/setup', methods=['GET', 'POST'])
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
            return redirect(url_for('login')) # Only allow setup if NO users exist
            
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
                return redirect(url_for('dashboard'))
                
        return render_template('setup.html')
    except Exception as outer_e:
        import traceback
        return f"<h1>Fatal Error in /setup:</h1><pre>{traceback.format_exc()}</pre>"

@app.route('/login', methods=['GET', 'POST'])
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
                return redirect(url_for('dashboard'))
            else:
                error = "Invalid email or password."
        else:
            error = "Email and password are required."
            
    return render_template('login.html', error=error)

@app.route('/claim-account', methods=['GET', 'POST'])
def claim_account():
    error = None
    if request.method == 'GET' and session.get('user_id'):
        session.clear() # Force clear session so they can claim a new account if they want
        
    if request.method == 'POST':
        invite_code = request.form.get('invite_code')
        email = request.form.get('email', '').strip().lower()
        pwd = request.form.get('password')
        full_name = request.form.get('full_name')
        
        if invite_code and email and pwd:
            import re as regex
            if len(pwd) < 8 or not regex.search(r"[A-Za-z]", pwd) or not regex.search(r"[0-9]", pwd):
                error = "Password must be at least 8 characters and contain both letters and numbers."
                return render_template('claim_account.html', error=error)

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
                return redirect(url_for('dashboard'))
            except Exception as e:
                error = "Email already in use or error creating account."
        else:
            error = "All fields are required."
            
    return render_template('claim_account.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('user_id', None)
    session.pop('role', None)
    return redirect(url_for('login'))

@app.route('/dashboard')
@app.route('/dashboard')
@leader_required
def dashboard():
    user_perms = []
    if session.get('user_id'):
        db = get_db()
        c = db.cursor()
        q = """
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN users u ON u.role_id = rp.role_id
            WHERE u.id = %s
        """ if IS_POSTGRES else """
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN users u ON u.role_id = rp.role_id
            WHERE u.id = ?
        """
        c.execute(q, (session['user_id'],))
        user_perms = [row[0] for row in c.fetchall()]
    else:
        # Legacy user gets basic manager permissions temporarily
        user_perms = ['view_dashboard', 'manage_members', 'manage_pods']
        
    return render_template('dashboard.html', user_permissions=user_perms)

# Stats
@app.route('/api/stats', methods=['GET'])
@permission_required('view_dashboard')
def get_stats():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    
    c.execute("SELECT COUNT(*) FROM members")
    total_members = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM pods")
    total_pods = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM members WHERE role='leader'")
    total_leaders = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM members WHERE is_active=1")
    total_active = c.fetchone()[0]
    
    c.execute("SELECT strftime('%Y-%m', join_date) as month, COUNT(*) as count FROM members GROUP BY strftime('%Y-%m', join_date) ORDER BY strftime('%Y-%m', join_date)")
    members_by_month = [{'month': row[0], 'count': row[1]} for row in c.fetchall() if row[0]]
    
    c.execute("SELECT spiritual_stage, COUNT(*) as count FROM members GROUP BY spiritual_stage")
    stage_distribution = {row[0]: row[1] for row in c.fetchall()}
    
    c.execute("SELECT COUNT(*) FROM attendance WHERE present=1")
    total_present = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM attendance")
    total_attendance = c.fetchone()[0]
    
    attendance_rate = 0
    if total_attendance > 0:
        attendance_rate = (total_present / total_attendance) * 100
        
    return jsonify({
        'total_members': total_members,
        'total_pods': total_pods,
        'total_leaders': total_leaders,
        'total_active': total_active,
        'members_by_month': members_by_month,
        'stage_distribution': stage_distribution,
        'attendance_rate': attendance_rate
    })

# Members
@app.route('/api/members', methods=['GET'])
@permission_required('manage_members')
def get_members():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '')
    db = get_db()
    c = db.cursor()
    query = """
        SELECT m.*, p.name as pod_name 
        FROM members m
        LEFT JOIN pod_members pm ON m.id = pm.member_id
        LEFT JOIN pods p ON pm.pod_id = p.id
    """
    params = []
    if search:
        query += " WHERE m.name LIKE ?"
        params.append(f"%{search}%")
        
    c.execute(query, params)
    members = [dict(row) for row in c.fetchall()]
    return jsonify(members)

@app.route('/api/members', methods=['POST'])
@permission_required('manage_members')
@validate_schema(MemberCreateSchema)
def create_member(validated_data: MemberCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {"name": validated_data.name, "email": validated_data.email, "phone": validated_data.phone, "role": validated_data.role, "spiritual_stage": validated_data.spiritual_stage}
    db = get_db()
    c = db.cursor()
    c.execute('''
        INSERT INTO members (name, email, phone, join_date, role, spiritual_stage)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data.get('name'), data.get('email'), data.get('phone'), data.get('join_date'), data.get('role', 'member'), data.get('spiritual_stage', 'new')))
    
    last_id = c.lastrowid
    if IS_POSTGRES and not last_id:
        c.execute("SELECT id FROM members WHERE email = %s ORDER BY id DESC LIMIT 1", (data.get('email'),))
        row = c.fetchone()
        if row:
            last_id = row['id'] if type(row) is dict else row[0]
            
    db.commit()
    return jsonify({'id': last_id}), 201

@app.route('/api/members/<int:id>', methods=['PUT'])
@permission_required('manage_members')
def update_member(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('''
        UPDATE members 
        SET name=?, email=?, phone=?, role=?, spiritual_stage=?, is_active=?
        WHERE id=?
    ''', (data.get('name'), data.get('email'), data.get('phone'), data.get('role'), data.get('spiritual_stage'), bool(data.get('is_active', True)), id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/members/<int:id>', methods=['DELETE'])
@permission_required('manage_members')
def delete_member(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM members WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/members/<int:id>/stage', methods=['PUT'])
@permission_required('manage_members')
@permission_required('manage_members')
def update_member_stage(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('UPDATE members SET spiritual_stage=? WHERE id=?', (data.get('stage'), id))
    db.commit()
    return jsonify({'success': True})

# Pods
@app.route('/api/pods', methods=['GET'])
@permission_required('manage_pods')
def get_pods():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    
    c.execute('''
        SELECT p.*, m.name as leader_name 
        FROM pods p 
        LEFT JOIN members m ON p.leader_id = m.id
    ''')
    pods_raw = c.fetchall()
    
    pods = []
    for pod_row in pods_raw:
        pod = dict(pod_row)
        c.execute('''
            SELECT m.* 
            FROM members m 
            JOIN pod_members pm ON m.id = pm.member_id 
            WHERE pm.pod_id = ?
        ''', (pod['id'],))
        pod['members'] = [dict(row) for row in c.fetchall()]
        pods.append(pod)
        
    return jsonify(pods)

@app.route('/api/pods', methods=['POST'])
@permission_required('manage_pods')
@validate_schema(PodCreateSchema)
def create_pod(validated_data: PodCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {"name": validated_data.name, "leader_id": validated_data.leader_id}
    db = get_db()
    c = db.cursor()
    c.execute('INSERT INTO pods (name, leader_id) VALUES (?, ?)', (data.get('name'), data.get('leader_id')))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

@app.route('/api/pods/<int:id>', methods=['PUT'])
@permission_required('manage_pods')
def update_pod(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('UPDATE pods SET name=?, leader_id=? WHERE id=?', (data.get('name'), data.get('leader_id'), id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/pods/<int:id>', methods=['DELETE'])
@permission_required('manage_pods')
def delete_pod(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM pods WHERE id=?', (id,))
    c.execute('DELETE FROM pod_members WHERE pod_id=?', (id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/pods/<int:pod_id>/members', methods=['POST'])
def add_pod_member(pod_id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    try:
        c.execute('INSERT INTO pod_members (pod_id, member_id) VALUES (?, ?)', (pod_id, data.get('member_id')))
        db.commit()
    except sqlite3.IntegrityError:
        pass
    return jsonify({'success': True})

@app.route('/api/pods/<int:pod_id>/members/<int:member_id>', methods=['DELETE'])
def remove_pod_member(pod_id, member_id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM pod_members WHERE pod_id=? AND member_id=?', (pod_id, member_id))
    db.commit()
    return jsonify({'success': True})

# Attendance
@app.route('/api/attendance', methods=['GET'])
@permission_required('manage_members')
def get_attendance():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    pod_id = request.args.get('pod_id')
    date = request.args.get('date')
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM attendance WHERE pod_id=? AND date=?', (pod_id, date))
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/attendance', methods=['POST'])
@permission_required('manage_members')
def log_attendance():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    pod_id = data.get('pod_id')
    date = data.get('date')
    records = data.get('records', [])
    
    db = get_db()
    c = db.cursor()
    
    # Delete existing records for this pod and date
    c.execute('DELETE FROM attendance WHERE pod_id=? AND date=?', (pod_id, date))
    
    for record in records:
        c.execute('INSERT INTO attendance (member_id, pod_id, date, present) VALUES (?, ?, ?, ?)',
                 (record.get('member_id'), pod_id, date, bool(record.get('present', False))))
                 
    db.commit()
    return jsonify({'success': True})

# Weekly Plans
@app.route('/api/weekly-plans', methods=['GET'])
@permission_required('manage_pods')
def get_weekly_plans():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    pod_id = request.args.get('pod_id')
    db = get_db()
    c = db.cursor()
    
    query = """
        SELECT w.*, p.name as pod_name, m.name as leader_name 
        FROM weekly_plans w
        LEFT JOIN pods p ON w.pod_id = p.id
        LEFT JOIN members m ON w.leader_id = m.id
    """
    params = []
    
    if pod_id:
        query += " WHERE w.pod_id = ?"
        params.append(pod_id)
        
    c.execute(query, params)
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/weekly-plans', methods=['POST'])
@permission_required('manage_pods')
@validate_schema(WeeklyPlanCreateSchema)
def create_weekly_plan(validated_data: WeeklyPlanCreateSchema):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = {
        "pod_id": validated_data.pod_id,
        "leader_id": validated_data.leader_id,
        "week_date": validated_data.week_date,
        "bible_passage": validated_data.bible_passage,
        "discussion_questions": validated_data.discussion_questions,
        "spiritual_goals": validated_data.spiritual_goals
    }
    db = get_db()
    c = db.cursor()
    
    c.execute('''
        INSERT INTO weekly_plans 
        (pod_id, leader_id, week_date, bible_passage, discussion_questions, spiritual_goals)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('pod_id'), data.get('leader_id'), data.get('week_date'), 
        data.get('bible_passage'), 
        json.dumps(data.get('discussion_questions')) if isinstance(data.get('discussion_questions'), (list, dict)) else data.get('discussion_questions'),
        json.dumps(data.get('spiritual_goals')) if isinstance(data.get('spiritual_goals'), (list, dict)) else data.get('spiritual_goals')
    ))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

@app.route('/api/weekly-plans/<int:id>', methods=['PUT'])
@permission_required('manage_pods')
def update_weekly_plan(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    
    c.execute('''
        UPDATE weekly_plans 
        SET post_meeting_notes=?, members_struggling=?, members_ready_to_lead=?
        WHERE id=?
    ''', (
        data.get('post_meeting_notes'),
        data.get('members_struggling'),
        data.get('members_ready_to_lead'),
        id
    ))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/weekly-plans/<int:id>', methods=['DELETE'])
@permission_required('manage_pods')
def delete_weekly_plan(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM weekly_plans WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

# Prayer
@app.route('/api/prayer', methods=['GET'])
@permission_required('view_dashboard')
def get_prayers():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    status = request.args.get('status')
    db = get_db()
    c = db.cursor()
    
    query = """
        SELECT p.*, m.name as member_name,
        (SELECT COUNT(*) FROM prayer_supporters ps WHERE ps.request_id = p.id) as supporter_count
        FROM prayer_requests p
        LEFT JOIN members m ON p.member_id = m.id
    """
    params = []
    
    if status:
        query += " WHERE p.status = ?"
        params.append(status)
        
    c.execute(query, params)
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/prayer', methods=['POST'])
def create_prayer():
    # Public route so users can submit from homepage
    try:
        data = request.json
        db = get_db()
        c = db.cursor()
        c.execute('''
            INSERT INTO prayer_requests (member_id, requester_name, request_text, is_urgent)
            VALUES (?, ?, ?, ?)
        ''', (data.get('member_id'), data.get('name'), data.get('request_text'), bool(data.get('is_urgent', False))))
        db.commit()
        return jsonify({'id': c.lastrowid}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/prayer/<int:id>', methods=['PUT'])
@permission_required('view_dashboard')
def update_prayer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    
    if 'status' in data and data['status'] == 'answered':
        c.execute('''
            UPDATE prayer_requests 
            SET status='answered', testimony=?, answered_at=CURRENT_TIMESTAMP
            WHERE id=?
        ''', (data.get('testimony'), id))
    else:
        c.execute('''
            UPDATE prayer_requests 
            SET request_text=?, is_urgent=?
            WHERE id=?
        ''', (data.get('request_text'), bool(data.get('is_urgent', False)), id))
        
    db.commit()
    return jsonify({'success': True})

@app.route('/api/prayer/<int:id>', methods=['DELETE'])
@permission_required('view_dashboard')
def delete_prayer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM prayer_requests WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/prayer/<int:id>/support', methods=['POST'])
@permission_required('view_dashboard')
def add_prayer_supporter(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('INSERT INTO prayer_supporters (request_id, member_id) VALUES (?, ?)', 
             (id, data.get('member_id')))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/prayer/<int:id>/supporters', methods=['GET'])
@permission_required('view_dashboard')
def get_prayer_supporters(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('''
        SELECT m.* 
        FROM members m
        JOIN prayer_supporters ps ON m.id = ps.member_id
        WHERE ps.request_id = ?
    ''', (id,))
    return jsonify([dict(row) for row in c.fetchall()])

# Pipeline
@app.route('/api/pipeline', methods=['GET'])
@permission_required('view_dashboard')
def get_pipeline():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    grouped = request.args.get('grouped') == 'true'
    db = get_db()
    c = db.cursor()
    
    c.execute('SELECT * FROM newcomer_pipeline')
    newcomers = [dict(row) for row in c.fetchall()]
    
    if grouped:
        grouped_data = {}
        for n in newcomers:
            stage = n.get('stage', 'first_contact')
            if stage not in grouped_data:
                grouped_data[stage] = []
            grouped_data[stage].append(n)
        return jsonify(grouped_data)
        
    return jsonify(newcomers)

@app.route('/api/pipeline', methods=['POST'])
def create_newcomer():
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('''
        INSERT INTO newcomer_pipeline (name, phone, email, notes, assigned_to)
        VALUES (?, ?, ?, ?, ?)
    ''', (data.get('name'), data.get('phone'), data.get('email'), data.get('notes'), data.get('assigned_to')))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

@app.route('/api/pipeline/<int:id>', methods=['PUT'])
@permission_required('view_dashboard')
def update_newcomer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    
    update_fields = []
    params = []
    for key in ['name', 'phone', 'email', 'stage', 'notes', 'assigned_to']:
        if key in data:
            update_fields.append(f"{key}=?")
            params.append(data[key])
            
    if not update_fields:
        return jsonify({'success': True})
        
    params.append(id)
    c.execute(f"UPDATE newcomer_pipeline SET {', '.join(update_fields)} WHERE id=?", tuple(params))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/pipeline/<int:id>', methods=['DELETE'])
@permission_required('view_dashboard')
def delete_newcomer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM newcomer_pipeline WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

# Devotionals
@app.route('/api/devotionals', methods=['GET'])
def get_devotionals():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM devotionals ORDER BY id DESC')
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/devotionals/latest', methods=['GET'])
def get_latest_devotional():
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM devotionals ORDER BY id DESC LIMIT 1')
    row = c.fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({}), 404

@app.route('/api/devotionals', methods=['POST'])
@permission_required('manage_settings')
def create_devotional():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('''
        INSERT INTO devotionals (title, content, author_id, week_date)
        VALUES (?, ?, ?, ?)
    ''', (data.get('title'), data.get('content'), data.get('author_id'), data.get('week_date')))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

# Resources
@app.route('/api/resources', methods=['GET'])
def get_resources():
    category = request.args.get('category')
    db = get_db()
    c = db.cursor()
    if category:
        c.execute('SELECT * FROM resources WHERE category=?', (category,))
    else:
        c.execute('SELECT * FROM resources')
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/resources', methods=['POST'])
@permission_required('manage_settings')
def create_resource():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('''
        INSERT INTO resources (title, description, category, file_url)
        VALUES (?, ?, ?, ?)
    ''', (data.get('title'), data.get('description'), data.get('category'), data.get('file_url')))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

@app.route('/api/resources/<int:id>', methods=['DELETE'])
@permission_required('manage_settings')
def delete_resource(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM resources WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

# Bible Verse
@app.route('/api/bible-verse', methods=['GET'])
def get_bible_verse():
    try:
        req = urllib.request.Request(
            'https://bible-api.com/?random=verse', 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            return jsonify(data)
    except Exception as e:
        return jsonify({
            'reference': 'John 3:16',
            'text': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
        })

if __name__ == '__main__':
    app.run(port=3000, debug=True)


@app.route('/api/invites', methods=['GET'])
@permission_required('manage_users')
def get_invites():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT i.id, i.code, i.is_used, i.created_at, r.name as role_name FROM invite_codes i JOIN roles r ON i.role_id = r.id WHERE i.is_used = FALSE ORDER BY i.created_at DESC" if IS_POSTGRES else "SELECT i.id, i.code, i.is_used, i.created_at, r.name as role_name FROM invite_codes i JOIN roles r ON i.role_id = r.id WHERE i.is_used = 0 ORDER BY i.created_at DESC")
    return jsonify([dict(row) for row in c.fetchall()])

@app.route('/api/invites/<int:id>', methods=['DELETE'])
@permission_required('manage_users')
def delete_invite(id):
    try:
        db = get_db()
        c = db.cursor()
        c.execute("DELETE FROM invite_codes WHERE id = %s" if IS_POSTGRES else "DELETE FROM invite_codes WHERE id = ?", (id,))
        db.commit()
        return jsonify({'success': True, 'rowcount': getattr(c, 'rowcount', 0)})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/invites', methods=['POST'])
@permission_required('manage_users')
def create_invite():
    import uuid
    code = str(uuid.uuid4()).split('-')[0].upper()
    role_id = request.json.get('role_id', 2) if request.json else 2 # Default Basic Manager
    db = get_db()
    c = db.cursor()
    q = "INSERT INTO invite_codes (code, role_id, created_by) VALUES (%s, %s, %s)" if IS_POSTGRES else "INSERT INTO invite_codes (code, role_id, created_by) VALUES (?, ?, ?)"
    c.execute(q, (code, role_id, session['user_id']))
    db.commit()
    return jsonify({"code": code, "role_id": role_id})

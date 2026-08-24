import re

with open('main.py', 'r') as f:
    content = f.read()

# 1. Update init_db to create session_version
init_target = """        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER,"""
        
init_replacement = """        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER,
        session_version INTEGER DEFAULT 1,"""
content = content.replace(init_target, init_replacement)

# For Postgres init_db:
init_pg_target = """        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES roles(id),"""
init_pg_replacement = """        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER REFERENCES roles(id),
        session_version INTEGER DEFAULT 1,"""
content = content.replace(init_pg_target, init_pg_replacement)

# 2. Add column to existing DB safely in get_db
db_target = """    db = g._database
    return db"""
    
db_replacement = """    db = g._database
    
    # Auto-migrate session_version
    try:
        if IS_POSTGRES:
            db.cursor().execute("ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 1;")
        else:
            db.cursor().execute("ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 1;")
        db.commit()
    except Exception:
        db.rollback() # Column already exists
        
    return db"""
content = content.replace(db_target, db_replacement)

# 3. Update login to store version
login_target = """                session['user_id'] = user['id']
                session['role'] = user['role_name']
                return redirect(url_for('dashboard'))"""
                
login_replacement = """                session['user_id'] = user['id']
                session['role'] = user['role_name']
                session['version'] = user.get('session_version', 1)
                return redirect(url_for('dashboard'))"""
content = content.replace(login_target, login_replacement)

# 4. Update logout to increment version
logout_target = """@app.route('/logout')
def logout():
    session.clear() # Clears server-side session data"""
    
logout_replacement = """@app.route('/logout')
def logout():
    if 'user_id' in session:
        db = get_db()
        c = db.cursor()
        c.execute("UPDATE users SET session_version = COALESCE(session_version, 1) + 1 WHERE id=%s" if IS_POSTGRES else "UPDATE users SET session_version = COALESCE(session_version, 1) + 1 WHERE id=?", (session['user_id'],))
        db.commit()
    session.clear() # Clears browser session"""
content = content.replace(logout_target, logout_replacement)

with open('main.py', 'w') as f:
    f.write(content)

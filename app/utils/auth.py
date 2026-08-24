from functools import wraps
from flask import session, redirect, url_for, jsonify
from app.db.database import get_db

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            # Allow legacy fallback for a short transition period
            if session.get('logged_in'):
                return f(*args, **kwargs)
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def leader_required(f):
    return login_required(f)

def permission_required(permission_name: str):
    """
    Decorator to enforce specific role permissions.
    Validates user against the db-backed role_permissions table.
    """
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
            """ if db.is_postgres else """
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

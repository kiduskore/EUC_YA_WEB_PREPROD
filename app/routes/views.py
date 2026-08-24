from flask import Blueprint, render_template, session
from app.utils.auth import leader_required
from app.db.database import get_db
from app.config import Config

views_bp = Blueprint('views', __name__)
IS_POSTGRES = Config.IS_POSTGRES

def salvation_page():
    return render_template('salvation.html')

def water_baptism_page():
    return render_template('water-baptism.html')

def kingdom_page():
    return render_template('kingdom.html')

def membership_page():
    return render_template('membership.html')

def community_page():
    return render_template('community.html')

def mentorship_page():
    return render_template('mentorship.html')

def scripture_memory_page():
    return render_template('scripture-memory.html')

def growth_page():
    return render_template('growth.html')

def maturity_page():
    return render_template('maturity.html')

def availability_page():
    return render_template('availability.html')

def serving_page():
    return render_template('serving.html')

def generosity_page():
    return render_template('generosity.html')

def index():
    return render_template('landing.html')

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


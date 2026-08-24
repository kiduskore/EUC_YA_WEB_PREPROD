from flask import Blueprint, jsonify, request, session, g, render_template
from app.db.database import get_db
from app.config import Config
from app.utils.email import send_invite_email
from app.utils.auth import permission_required, leader_required

api_bp = Blueprint('api', __name__, url_prefix='/api')
IS_POSTGRES = Config.IS_POSTGRES

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
    
    c.execute("SELECT strftime('%Y-%m', join_date) as month, COUNT(*) as count FROM members GROUP BY month ORDER BY month")
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

def create_member():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
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

def delete_member(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM members WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

def update_member_stage(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('UPDATE members SET spiritual_stage=? WHERE id=?', (data.get('stage'), id))
    db.commit()
    return jsonify({'success': True})

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

def create_pod():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('INSERT INTO pods (name, leader_id) VALUES (?, ?)', (data.get('name'), data.get('leader_id')))
    db.commit()
    return jsonify({'id': c.lastrowid}), 201

def update_pod(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    db = get_db()
    c = db.cursor()
    c.execute('UPDATE pods SET name=?, leader_id=? WHERE id=?', (data.get('name'), data.get('leader_id'), id))
    db.commit()
    return jsonify({'success': True})

def delete_pod(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM pods WHERE id=?', (id,))
    c.execute('DELETE FROM pod_members WHERE pod_id=?', (id,))
    db.commit()
    return jsonify({'success': True})

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

def remove_pod_member(pod_id, member_id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM pod_members WHERE pod_id=? AND member_id=?', (pod_id, member_id))
    db.commit()
    return jsonify({'success': True})

def get_attendance():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    pod_id = request.args.get('pod_id')
    date = request.args.get('date')
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM attendance WHERE pod_id=? AND date=?', (pod_id, date))
    return jsonify([dict(row) for row in c.fetchall()])

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

def create_weekly_plan():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
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

def delete_weekly_plan(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM weekly_plans WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

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

def delete_newcomer(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM newcomer_pipeline WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

def get_devotionals():
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM devotionals ORDER BY id DESC')
    return jsonify([dict(row) for row in c.fetchall()])

def get_latest_devotional():
    db = get_db()
    c = db.cursor()
    c.execute('SELECT * FROM devotionals ORDER BY id DESC LIMIT 1')
    row = c.fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({}), 404

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

def get_resources():
    category = request.args.get('category')
    db = get_db()
    c = db.cursor()
    if category:
        c.execute('SELECT * FROM resources WHERE category=?', (category,))
    else:
        c.execute('SELECT * FROM resources')
    return jsonify([dict(row) for row in c.fetchall()])

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

def delete_resource(id):
    if session.get("role") != "leader":
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    c = db.cursor()
    c.execute('DELETE FROM resources WHERE id=?', (id,))
    db.commit()
    return jsonify({'success': True})

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

def get_invites():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT i.id, i.code, i.is_used, i.created_at, r.name as role_name FROM invite_codes i JOIN roles r ON i.role_id = r.id WHERE i.is_used = FALSE ORDER BY i.created_at DESC" if IS_POSTGRES else "SELECT i.id, i.code, i.is_used, i.created_at, r.name as role_name FROM invite_codes i JOIN roles r ON i.role_id = r.id WHERE i.is_used = 0 ORDER BY i.created_at DESC")
    return jsonify([dict(row) for row in c.fetchall()])

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


import re

with open('main.py', 'r') as f:
    content = f.read()

target = """def block_direct_ip():
    if request.host.startswith('127.0.0.1') or request.host.startswith('localhost'):
        return"""

replacement = """def block_direct_ip():
    # Check session revocation
    if 'user_id' in session and 'version' in session:
        db = get_db()
        c = db.cursor()
        c.execute("SELECT session_version FROM users WHERE id=%s" if IS_POSTGRES else "SELECT session_version FROM users WHERE id=?", (session['user_id'],))
        row = c.fetchone()
        if not row or row.get('session_version', 1) != session['version']:
            session.clear()
            
    if request.host.startswith('127.0.0.1') or request.host.startswith('localhost'):
        return"""

content = content.replace(target, replacement)
with open('main.py', 'w') as f:
    f.write(content)

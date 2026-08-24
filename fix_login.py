import re

with open('main.py', 'r') as f:
    content = f.read()

target = """            if user and check_password_hash(user['password_hash'], pwd):
                session.clear()
                session['user_id'] = user['id']
                session['role'] = user['role_name']
                session['version'] = user.get('session_version', 1)
                return redirect(url_for('dashboard'))
            else:
                error = 'Invalid credentials.'"""

replacement = """            if user and check_password_hash(user['password_hash'], pwd):
                session.clear()
                session['user_id'] = user['id']
                session['role'] = user['role_name']
                session['version'] = user.get('session_version', 1)
                return redirect(url_for('dashboard'))
            else:
                import time
                time.sleep(1.5) # Basic anti-brute-force delay
                error = 'Invalid credentials.'"""
                
content = content.replace(target, replacement)
with open('main.py', 'w') as f:
    f.write(content)

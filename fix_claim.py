with open('main.py', 'r') as f:
    content = f.read()

target = """def claim_account():
    error = None
    if session.get('user_id'):
        return redirect(url_for('dashboard'))"""
        
replacement = """def claim_account():
    error = None
    if request.method == 'GET' and session.get('user_id'):
        session.clear() # Force clear session so they can claim a new account if they want"""
        
content = content.replace(target, replacement)
with open('main.py', 'w') as f:
    f.write(content)

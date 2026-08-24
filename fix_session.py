import re

with open('main.py', 'r') as f:
    content = f.read()

# Add SESSION cookie security configs
configs = """app.secret_key = 'euc_super_secret_key_2026'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
"""
content = content.replace("app.secret_key = 'euc_super_secret_key_2026'\n", configs)

# Fix logout route to clear the session SERVER SIDE
logout_target = """@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))"""
    
logout_replacement = """@app.route('/logout')
def logout():
    session.clear() # Clears server-side session data
    res = redirect(url_for('login'))
    res.set_cookie('session', '', expires=0) # Hard delete browser cookie
    return res"""
content = content.replace(logout_target, logout_replacement)

with open('main.py', 'w') as f:
    f.write(content)

import re

with open('main.py', 'r') as f:
    content = f.read()

# Pass user_email and user_role to dashboard
target = """    return render_template('dashboard.html', 
                         user_permissions=permissions)"""

replacement = """    
    c.execute("SELECT email, role_id FROM users WHERE id=?", (session['user_id'],))
    user_row = c.fetchone()
    user_email = user_row['email'] if user_row else 'leader@euc.org'
    
    return render_template('dashboard.html', 
                         user_permissions=permissions,
                         user_email=user_email,
                         user_role=session.get('role', 'Leader'))"""

content = content.replace(target, replacement)
with open('main.py', 'w') as f:
    f.write(content)

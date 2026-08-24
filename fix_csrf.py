import re

with open('main.py', 'r') as f:
    content = f.read()

csrf_logic = """
@app.before_request
def check_csrf():
    if request.method in ['POST', 'PUT', 'DELETE']:
        # Exempt public routes
        if request.endpoint in ['login', 'claim_account', 'create_prayer', 'create_newcomer', 'log_attendance']:
            return
            
        token = request.headers.get('X-CSRF-Token')
        if not token or token != session.get('csrf_token'):
            return jsonify({'error': 'CSRF token missing or invalid'}), 403

@app.after_request
def set_csrf_cookie(response):
    if 'csrf_token' not in session:
        import uuid
        session['csrf_token'] = str(uuid.uuid4())
    # Send token in a cookie that JS can read
    response.set_cookie('csrf_token', session['csrf_token'], secure=True, samesite='Lax')
    
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
"""

content = content.replace("def add_security_headers(response):\n    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'", csrf_logic)

with open('main.py', 'w') as f:
    f.write(content)

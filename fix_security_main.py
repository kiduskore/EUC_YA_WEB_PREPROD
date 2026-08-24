with open('main.py', 'r') as f:
    content = f.read()

security_code = """
@app.before_request
def check_csrf():
    if request.method in ['POST', 'PUT', 'DELETE']:
        if request.endpoint in ['login', 'claim_account', 'create_prayer', 'create_newcomer', 'log_attendance']:
            return
        token = request.headers.get('X-CSRF-Token')
        if not token or token != session.get('csrf_token'):
            return jsonify({'error': 'CSRF token missing or invalid'}), 403

@app.after_request
def add_security_headers(response):
    if 'csrf_token' not in session:
        import uuid
        session['csrf_token'] = str(uuid.uuid4())
    response.set_cookie('csrf_token', session['csrf_token'], secure=True, samesite='Lax')
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;"
    response.headers['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
    # Also add COOP and COEP for Origin Isolation
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    # Adding require-trusted-types-for to mitigate DOM XSS
    response.headers['Content-Security-Policy'] += " require-trusted-types-for 'script';"
    return response

"""

if "def check_csrf():" not in content:
    content = content.replace("app.secret_key = 'euc_super_secret_key_2026'\n", "app.secret_key = 'euc_super_secret_key_2026'\n" + security_code)

with open('main.py', 'w') as f:
    f.write(content)


with open('main.py', 'r') as f:
    content = f.read()

headers_code = """
@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Basic CSP to prevent XSS
    response.headers['Content-Security-Policy'] = "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data:;"
    response.headers['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
    return response

"""
content = content.replace("def block_direct_ip():", headers_code + "def block_direct_ip():")

with open('main.py', 'w') as f:
    f.write(content)

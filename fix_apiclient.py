import re

with open('static/js/dashboard/apiClient.js', 'r') as f:
    content = f.read()

target = """            options.headers = { 
                'Content-Type': 'application/json', 
                ...(options.headers || {}) 
            };"""
            
replacement = """            
            // Extract CSRF token from cookie
            const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
            const csrfToken = csrfCookie ? csrfCookie.split('=')[1] : '';
            
            options.headers = { 
                'Content-Type': 'application/json', 
                'X-CSRF-Token': csrfToken,
                ...(options.headers || {}) 
            };"""

content = content.replace(target, replacement)
with open('static/js/dashboard/apiClient.js', 'w') as f:
    f.write(content)

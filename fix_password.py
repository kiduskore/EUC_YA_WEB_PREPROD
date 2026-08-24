import re

with open('main.py', 'r') as f:
    content = f.read()

target = """        if invite_code and email and pwd:"""

replacement = """        if invite_code and email and pwd:
            import re as regex
            if len(pwd) < 8 or not regex.search(r"[A-Za-z]", pwd) or not regex.search(r"[0-9]", pwd):
                error = "Password must be at least 8 characters and contain both letters and numbers."
                return render_template('claim_account.html', error=error)
"""

content = content.replace(target, replacement)
with open('main.py', 'w') as f:
    f.write(content)

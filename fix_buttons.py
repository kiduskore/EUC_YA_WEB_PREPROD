import os, glob

for file in glob.glob('templates/*.html'):
    with open(file, 'r') as f:
        content = f.read()
    
    # We want to replace:
    # <button onclick="alert('Registration opening soon!')" ...>
    # ...
    # </button>
    # with
    # <a href="/#join" ...>
    # ...
    # </a>
    
    import re
    def replacer(match):
        attrs = match.group(1).replace("onclick=\"alert('Registration opening soon!')\"", "href=\"/#join\"")
        inner = match.group(2)
        return f'<a {attrs}>{inner}</a>'
        
    content = re.sub(r'<button([^>]*onclick="alert\(\'Registration opening soon!\'\)"[^>]*)>(.*?)</button>', replacer, content, flags=re.DOTALL)
    
    with open(file, 'w') as f:
        f.write(content)

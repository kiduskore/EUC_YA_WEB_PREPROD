import re

with open('templates/dashboard.html', 'r') as f:
    content = f.read()

# Find the specific script tag using regex
# We want to replace the block starting with `<script>` and ending with `</script>{% endraw %}`
# at the very end of the file.
new_content = re.sub(
    r'<script>\s*const \{ createApp, ref.*?</script>(\s*\{%\s*endraw\s*%\}\s*</body>\s*</html>)',
    r'<script type="module" src="/static/js/dashboard/main.js"></script>\1',
    content,
    flags=re.DOTALL
)

with open('templates/dashboard.html', 'w') as f:
    f.write(new_content)

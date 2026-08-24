import re

with open('templates/landing.html', 'r') as f:
    content = f.read()

# Extract from "<!-- Join Us Section -->" to "{% endblock %}"
match = re.search(r'(<!-- Join Us Section -->.*)(?={% endblock %})', content, re.DOTALL)
if match:
    sections = match.group(1)
    with open('footer_sections.html', 'w') as out:
        out.write(sections)
    print("Extracted successfully!")
else:
    print("Could not find sections.")

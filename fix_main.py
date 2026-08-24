with open('static/js/dashboard/main.js', 'r') as f:
    content = f.read()

# Replace api( with apiClient(
content = content.replace('await api(', 'await apiClient(')
content = content.replace('const api = async', '// Removed legacy API client\n            // const api = async')

# Prepend the import
new_content = "import { apiClient } from '/static/js/dashboard/apiClient.js';\n\n" + content

with open('static/js/dashboard/main.js', 'w') as f:
    f.write(new_content)

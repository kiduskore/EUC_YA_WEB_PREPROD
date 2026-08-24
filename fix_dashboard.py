with open('templates/dashboard.html', 'r') as f:
    lines = f.readlines()

out = []
for line in lines:
    if line.strip() == '<script>':
        out.append('<script type="module" src="/static/js/dashboard/main.js"></script>\n')
        out.append('{% endraw %}\n</body>\n</html>\n')
        break
    out.append(line)

with open('templates/dashboard.html', 'w') as f:
    f.writelines(out)

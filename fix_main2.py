with open('static/js/dashboard/main.js', 'r') as f:
    lines = f.readlines()

out = []
skip = False
for line in lines:
    if "// Removed legacy API client" in line:
        skip = True
        continue
    if skip:
        # We need to find the end of the `try { ... } catch { ... } };` block
        if "console.error('API Error:', url, e); return null; }" in line:
            skip = False # Found the catch block
            continue
        if "};" in line and not out: # Just a failsafe
            pass
        continue
    out.append(line)

with open('static/js/dashboard/main.js', 'w') as f:
    f.writelines(out)

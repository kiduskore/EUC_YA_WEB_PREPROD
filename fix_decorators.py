import re

with open('main.py', 'r') as f:
    content = f.read()

# We need to swap the order.
# Currently: 
# @permission_required(...)
# @app.route(...)
# or
# @leader_required
# @app.route(...)

# Find all occurrences of (decorator) then (route)
# (?:@permission_required\('[^']+'\)\n|@leader_required\n|@login_required\n)+@app\.route\('[^']+',?.*?\)\n

def replacer(match):
    lines = match.group(0).strip().split('\n')
    route_line = None
    decorators = []
    for line in lines:
        if line.startswith('@app.route'):
            route_line = line
        else:
            decorators.append(line)
    
    if route_line:
        return route_line + '\n' + '\n'.join(decorators) + '\n'
    return match.group(0)

new_content = re.sub(r'((?:@permission_required\([^)]+\)\n|@leader_required\n|@login_required\n)+)(@app\.route\([^)]+\)\n)', replacer, content)

with open('main.py', 'w') as f:
    f.write(new_content)

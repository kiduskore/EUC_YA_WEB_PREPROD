import re

with open('main.py', 'r') as f:
    content = f.read()

# I will write a regex to find all route definitions and their bodies
routes = re.findall(r'(@app\.route.*?)(?=\n@app\.route|\n\n\n|\Z)', content, re.DOTALL)

# Let's print out how many routes we found
print(f"Found {len(routes)} routes")

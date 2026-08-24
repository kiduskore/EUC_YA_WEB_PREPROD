with open('main.py', 'r') as f:
    content = f.read()

target = "query = query.replace(\"strftime('%Y-%m', join_date)\", \"to_char(join_date, 'YYYY-MM')\")"
replacement = "query = query.replace(\"strftime('%Y-%m', join_date)\", \"to_char(join_date::timestamp, 'YYYY-MM')\")"
content = content.replace(target, replacement)

with open('main.py', 'w') as f:
    f.write(content)

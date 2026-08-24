import re
import os

with open('main.py', 'r') as f:
    content = f.read()

# 1. Extract everything before the first route definition
# The first route is usually @app.route('/salvation') or similar
match = re.search(r'(@app\.route)', content)
header_idx = match.start()
header_content = content[:header_idx]
routes_content = content[header_idx:]

# Split routes by @app.route
route_blocks = re.split(r'(?=@app\.route)', routes_content)

api_routes = []
auth_routes = []
view_routes = []

for block in route_blocks:
    if not block.strip():
        continue
    
    # Change @app.route to @bp.route
    # Wait, some routes have multiple @app.route decorators!
    # Let's replace all @app.route with @api_bp.route or @auth_bp.route
    
    if "route('/api/" in block:
        block = block.replace('@app.route', '@api_bp.route')
        api_routes.append(block)
    elif any(auth_path in block for auth_path in ["route('/login", "route('/logout", "route('/setup", "route('/claim-account"]):
        block = block.replace('@app.route', '@auth_bp.route')
        auth_routes.append(block)
    else:
        block = block.replace('@app.route', '@views_bp.route')
        view_routes.append(block)

# Generate API Blueprint File
with open('app/routes/api.py', 'w') as f:
    f.write("from flask import Blueprint, jsonify, request, session, g\n")
    f.write("from app.db.database import get_db, Config\n")
    f.write("from app.utils.auth import permission_required, leader_required\n\n")
    f.write("api_bp = Blueprint('api', __name__, url_prefix='/api')\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    f.write("".join(api_routes).replace("'/api/", "'/")) # Strip /api from routes since it's in url_prefix

# Generate Auth Blueprint File
with open('app/routes/auth.py', 'w') as f:
    f.write("from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for\n")
    f.write("from app.db.database import get_db, Config\n")
    f.write("from werkzeug.security import generate_password_hash, check_password_hash\n\n")
    f.write("auth_bp = Blueprint('auth', __name__)\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    f.write("".join(auth_routes))

# Generate Views Blueprint File
with open('app/routes/views.py', 'w') as f:
    f.write("from flask import Blueprint, render_template, session\n")
    f.write("from app.utils.auth import leader_required\n")
    f.write("from app.db.database import get_db, Config\n\n")
    f.write("views_bp = Blueprint('views', __name__)\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    f.write("".join(view_routes))

print("Split completed successfully!")

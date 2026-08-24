import ast
import os

with open('main.py', 'r') as f:
    source = f.read()

tree = ast.parse(source)

api_functions = []
auth_functions = []
view_functions = []
other_code = []

def get_source_segment(node):
    return ast.get_source_segment(source, node)

for node in tree.body:
    if isinstance(node, ast.FunctionDef):
        is_route = False
        route_path = ""
        for dec in node.decorator_list:
            if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                if dec.func.attr == 'route':
                    is_route = True
                    if dec.args and isinstance(dec.args[0], ast.Constant):
                        route_path = dec.args[0].value
                        break
        
        if is_route:
            func_source = get_source_segment(node)
            if route_path.startswith('/api/'):
                func_source = func_source.replace('@app.route', '@api_bp.route')
                api_functions.append(func_source)
            elif route_path in ['/login', '/logout', '/setup', '/claim-account']:
                func_source = func_source.replace('@app.route', '@auth_bp.route')
                auth_functions.append(func_source)
            else:
                func_source = func_source.replace('@app.route', '@views_bp.route')
                view_functions.append(func_source)
        else:
            other_code.append(get_source_segment(node))
    else:
        other_code.append(get_source_segment(node))

# Write api.py
with open('app/routes/api.py', 'w') as f:
    f.write("from flask import Blueprint, jsonify, request, session, g, render_template\n")
    f.write("from app.db.database import get_db\n")
    f.write("from app.config import Config\n")
    f.write("from app.utils.auth import permission_required, leader_required\n\n")
    f.write("api_bp = Blueprint('api', __name__, url_prefix='/api')\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    for func in api_functions:
        f.write(func.replace("'/api/", "'/") + "\n\n")

# Write auth.py
with open('app/routes/auth.py', 'w') as f:
    f.write("from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for\n")
    f.write("from app.db.database import get_db\n")
    f.write("from app.config import Config\n")
    f.write("from werkzeug.security import generate_password_hash, check_password_hash\n\n")
    f.write("auth_bp = Blueprint('auth', __name__)\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    for func in auth_functions:
        f.write(func + "\n\n")

# Write views.py
with open('app/routes/views.py', 'w') as f:
    f.write("from flask import Blueprint, render_template, session\n")
    f.write("from app.utils.auth import leader_required\n")
    f.write("from app.db.database import get_db\n")
    f.write("from app.config import Config\n\n")
    f.write("views_bp = Blueprint('views', __name__)\n")
    f.write("IS_POSTGRES = Config.IS_POSTGRES\n\n")
    for func in view_functions:
        f.write(func + "\n\n")

print("AST Split completed successfully!")

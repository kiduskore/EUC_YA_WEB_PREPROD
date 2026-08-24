from flask import Blueprint

api_bp = Blueprint('api', __name__, url_prefix='/api')
views_bp = Blueprint('views', __name__)
auth_bp = Blueprint('auth', __name__)

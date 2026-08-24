from flask import Flask
from app.config import Config
from app.db.database import close_connection

def create_app(config_class=Config):
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.config.from_object(config_class)

    app.teardown_appcontext(close_connection)

    from app.routes.api import api_bp
    from app.routes.auth import auth_bp
    from app.routes.views import views_bp

    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(views_bp)

    return app

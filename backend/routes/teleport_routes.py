
from flask import Blueprint
from routes.teleport_auth import teleport_auth_routes
from routes.teleport_users import teleport_users_routes
from routes.teleport_scheduler import teleport_scheduler_routes

# Create a Blueprint for teleport routes
teleport_routes = Blueprint('teleport_routes', __name__)

# Register sub-blueprints
teleport_routes.register_blueprint(teleport_auth_routes)
teleport_routes.register_blueprint(teleport_users_routes)
teleport_routes.register_blueprint(teleport_scheduler_routes)

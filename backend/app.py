
from flask import Flask, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from flask_bcrypt import Bcrypt

# Import utility modules
from backend.utils.logging_config import setup_logging
from backend.utils.auth import token_required
from backend.config import DEBUG, SSH_HOSTS, SSH_PORT, SSH_USER

# Import route modules
from backend.routes.user_routes import user_routes
from backend.routes.teleport_routes import teleport_routes

# Setup logging
logger = setup_logging()

# Initialize Flask app
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Register blueprints (routes)
app.register_blueprint(user_routes)
app.register_blueprint(teleport_routes)

# Log the SSH configuration (excluding sensitive data)
logger.info(f"Loaded SSH configuration: hosts={SSH_HOSTS}, port={SSH_PORT}, user={SSH_USER}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=DEBUG)

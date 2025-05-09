
from flask import Flask, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from flask_bcrypt import Bcrypt

# Import utility modules
from utils.logging_config import setup_logging
from utils.auth import token_required
from config import DEBUG, SSH_HOSTS, SSH_PORT, SSH_USER

# Import route modules
from routes.user_routes import user_routes
from routes.teleport_routes import teleport_routes

# Import the task scheduler
from scheduler import scheduler

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

# Start the scheduler when the app starts
# Replace deprecated @app.before_first_request with proper startup function
with app.app_context():
    logger.info("Starting the task scheduler")
    scheduler.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=DEBUG)

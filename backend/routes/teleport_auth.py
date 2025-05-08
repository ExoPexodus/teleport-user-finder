
from flask import Blueprint, request, jsonify
import logging
from flask_bcrypt import Bcrypt
from utils.auth import generate_token
from config import AUTH_USERNAME, AUTH_PASSWORD_HASH

# Create a Blueprint for teleport auth routes
teleport_auth_routes = Blueprint('teleport_auth_routes', __name__)
bcrypt = Bcrypt()

@teleport_auth_routes.route('/teleport/login', methods=['POST'])
def login():
    """Handle user login and generate JWT token."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    logging.info(f"Login attempt for user: {username}")

    if username != AUTH_USERNAME or not bcrypt.check_password_hash(AUTH_PASSWORD_HASH, password):
        logging.warning(f"Failed login attempt for user: {username}")
        return jsonify({'message': 'Invalid username or password'}), 401

    # Create JWT token
    token = generate_token(username)

    logging.info(f"JWT token created for user: {username}")
    return jsonify({'token': token})

@teleport_auth_routes.route('/teleport/generate-hash', methods=['POST'])
def generate_hash():
    """Generate a password hash - useful for setup."""
    # ... keep existing code (password hash generation)

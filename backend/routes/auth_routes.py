
from flask import Blueprint, request, jsonify
import logging
from utils.keycloak_auth import login_user, token_required, admin_required
from utils.logging_config import setup_logging

logger = setup_logging()

# Create a Blueprint for auth routes
auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/auth/login', methods=['POST'])
def login():
    """Handle user login via Keycloak"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    logger.info(f"Login attempt for user: {username}")
    
    # Authenticate with Keycloak
    token_data = login_user(username, password)
    
    if not token_data:
        logger.warning(f"Failed login attempt for user: {username}")
        return jsonify({'message': 'Invalid username or password'}), 401
    
    logger.info(f"Successful login for user: {username}")
    return jsonify(token_data), 200

@auth_routes.route('/auth/profile', methods=['GET'])
@token_required
def get_profile():
    """Get user profile from token"""
    user_data = request.user
    
    # Extract relevant user information
    profile = {
        'username': user_data.get('preferred_username'),
        'email': user_data.get('email'),
        'name': user_data.get('name'),
        'roles': user_data.get('realm_access', {}).get('roles', [])
    }
    
    return jsonify(profile), 200

@auth_routes.route('/auth/admin-check', methods=['GET'])
@admin_required
def admin_check():
    """Test endpoint for admin access"""
    return jsonify({'message': 'You have admin access!'}), 200


from flask import Blueprint, request, jsonify
import logging
from utils.keycloak_auth import login_user, token_required, role_required
from utils.logging_config import setup_logging
from utils.admin_sync import sync_admin_user

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
    
    # Get the decoded token data from the access_token
    token_info = token_data.get('decoded_token')
    if not token_info:
        logger.warning(f"No decoded token found for user: {username}")
        return jsonify({'message': 'Failed to decode token'}), 500
        
    # Sync user with local database
    admin_user = sync_admin_user(token_info)
    if not admin_user:
        logger.warning(f"Failed to sync admin user: {username}")
    
    logger.info(f"Successful login for user: {username}")
    return jsonify(token_data), 200

@auth_routes.route('/auth/profile', methods=['GET'])
@token_required
def get_profile():
    """Get user profile from token"""
    user_data = request.user
    admin_user = request.admin_user
    
    # Extract relevant user information
    profile = {
        'username': user_data.get('preferred_username'),
        'email': user_data.get('email'),
        'name': user_data.get('name'),
        'roles': admin_user.roles.split(',') if admin_user.roles else [],
        'givenName': admin_user.given_name,
        'familyName': admin_user.family_name
    }
    
    return jsonify(profile), 200

@auth_routes.route('/auth/admin-check', methods=['GET'])
@role_required('admin')
def admin_check():
    """Test endpoint for admin access"""
    return jsonify({'message': 'You have admin access!'}), 200

@auth_routes.route('/auth/limited-user-check', methods=['GET'])
@role_required('limited_user')
def limited_user_check():
    """Test endpoint for limited user access"""
    return jsonify({'message': 'You have limited user access!'}), 200

@auth_routes.route('/auth/multi-role-check', methods=['GET'])
@role_required(['admin', 'power_user'])
def multi_role_check():
    """Test endpoint that allows multiple roles to access"""
    return jsonify({'message': 'You have either admin or power user access!'}), 200

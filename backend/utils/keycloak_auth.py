
import json
import logging
import requests
from flask import request, jsonify
from functools import wraps
import os
from jose import jwt
from config import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET

logger = logging.getLogger(__name__)

# Default values if not set in environment
DEFAULT_KEYCLOAK_URL = "http://keycloak:8080"
DEFAULT_KEYCLOAK_REALM = "teleport"
DEFAULT_KEYCLOAK_CLIENT_ID = "teleport-client"
DEFAULT_KEYCLOAK_CLIENT_SECRET = ""

# Get Keycloak configuration with defaults
KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", DEFAULT_KEYCLOAK_URL)
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", DEFAULT_KEYCLOAK_REALM)
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", DEFAULT_KEYCLOAK_CLIENT_ID)
KEYCLOAK_CLIENT_SECRET = os.environ.get("KEYCLOAK_CLIENT_SECRET", DEFAULT_KEYCLOAK_CLIENT_SECRET)

# Cache for public key
PUBLIC_KEY = None

def get_public_key():
    """Get Keycloak public key for token validation"""
    global PUBLIC_KEY
    if PUBLIC_KEY:
        return PUBLIC_KEY
        
    try:
        # Retrieve the public key from Keycloak
        url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
        response = requests.get(url)
        response.raise_for_status()
        
        realm_info = response.json()
        PUBLIC_KEY = f"-----BEGIN PUBLIC KEY-----\n{realm_info['public_key']}\n-----END PUBLIC KEY-----"
        return PUBLIC_KEY
    except Exception as e:
        logger.error(f"Failed to retrieve Keycloak public key: {e}")
        return None

def verify_token(token):
    """Verify JWT token from Keycloak"""
    try:
        public_key = get_public_key()
        if not public_key:
            return None
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="account"
        )
        return payload
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

def token_required(f):
    """Decorator for routes that require token authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({'message': 'Missing authorization token!'}), 401
            
        # Verify token
        user_data = verify_token(token)
        if not user_data:
            return jsonify({'message': 'Invalid or expired token!'}), 401
            
        # Add user data to the request context
        request.user = user_data
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator for routes that require admin role"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user_roles = request.user.get('realm_access', {}).get('roles', [])
        
        if 'admin' not in user_roles:
            return jsonify({'message': 'Admin privileges required!'}), 403
            
        return f(*args, **kwargs)
    
    return decorated

def login_user(username, password):
    """Login a user via Keycloak and return access token"""
    try:
        url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
        payload = {
            'client_id': KEYCLOAK_CLIENT_ID,
            'client_secret': KEYCLOAK_CLIENT_SECRET,
            'grant_type': 'password',
            'username': username,
            'password': password
        }
        
        response = requests.post(url, data=payload)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        logger.error(f"Login failed: {e}")
        return None

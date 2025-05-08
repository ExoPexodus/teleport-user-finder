
import jwt
import logging
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from config import SECRET_KEY, AUTH_USERNAME

def token_required(f):
    """Decorator to verify JWT token for protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')  # Expect token in headers
        if not token:
            logging.warning('Missing token in request')
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if data['username'] != AUTH_USERNAME:
                logging.warning('Invalid user in token')
                return jsonify({'message': 'Invalid user!'}), 403
        except jwt.ExpiredSignatureError:
            logging.warning('Token has expired')
            return jsonify({'message': 'Token has expired!'}), 403
        except jwt.InvalidTokenError:
            logging.warning('Invalid token provided')
            return jsonify({'message': 'Token is invalid!'}), 403
        return f(*args, **kwargs)
    return decorated

def generate_token(username):
    """Generate a new JWT token for the given username."""
    return jwt.encode(
        {'username': username, 'exp': datetime.utcnow() + timedelta(hours=24)},
        SECRET_KEY, algorithm="HS256"
    )

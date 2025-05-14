
from flask import Blueprint, jsonify, request
import logging
from utils.db import get_db_session, get_db_connection
from models.user import User
import psycopg2.extras

# Create a Blueprint for user routes
user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/api/users', methods=['GET'])
def get_users():
    """Get all users or filter by portal."""
    portal = request.args.get('portal')
    
    session = get_db_session()
    
    try:
        query = session.query(User)
        if portal:
            query = query.filter(User.portal == portal)
            
        users = query.all()
        
        # Convert ORM objects to dictionaries
        result = []
        for user in users:
            user_dict = {
                'id': user.id,
                'name': user.name,
                'roles': user.roles.split(',') if user.roles else [],
                'createdDate': user.created_date.isoformat() if user.created_date else None,
                'lastLogin': user.last_login.isoformat() if user.last_login else None,
                'status': user.status,
                'manager': user.manager,
                'portal': user.portal,
                # Add Keycloak fields
                'keycloakId': user.keycloak_id,
                'email': user.email,
                'givenName': user.given_name,
                'familyName': user.family_name,
                'preferredUsername': user.preferred_username
            }
            result.append(user_dict)
        
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching users: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@user_routes.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user by ID."""
    data = request.json
    
    session = get_db_session()
    
    try:
        # Format roles as comma-separated string
        roles = ','.join(data['roles']) if data.get('roles') else ''
        
        user = session.query(User).filter_by(id=user_id).first()
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
            
        # Update user fields
        user.name = data['name']
        user.roles = roles
        user.status = data['status']
        user.manager = data['manager']
        user.portal = data['portal']
        
        # Update Keycloak fields if present
        if 'email' in data:
            user.email = data['email']
        if 'givenName' in data:
            user.given_name = data['givenName']
        if 'familyName' in data:
            user.family_name = data['familyName']
        if 'preferredUsername' in data:
            user.preferred_username = data['preferredUsername']
        
        session.commit()
        
        return jsonify({"success": True, "message": "User updated successfully"})
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating user {user_id}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ... keep existing code (delete_users function) the same

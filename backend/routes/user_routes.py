
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
                'portal': user.portal
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
        
        session.commit()
        
        return jsonify({"success": True, "message": "User updated successfully"})
    except Exception as e:
        session.rollback()
        logging.error(f"Error updating user {user_id}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@user_routes.route('/api/users', methods=['DELETE'])
def delete_users():
    """Delete multiple users by IDs."""
    data = request.json
    user_ids = data.get('ids', [])
    
    if not user_ids:
        return jsonify({"success": False, "message": "No user IDs provided"}), 400
        
    session = get_db_session()
    
    try:
        deleted_count = session.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session='fetch')
        session.commit()
        
        if deleted_count > 0:
            return jsonify({
                "success": True, 
                "message": f"{deleted_count} users deleted successfully", 
                "deleted_ids": user_ids
            })
        return jsonify({"success": False, "message": "No users found with the provided IDs"}), 404
    except Exception as e:
        session.rollback()
        logging.error(f"Error deleting users {user_ids}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

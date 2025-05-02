
from flask import Blueprint, jsonify, request
import logging
from backend.utils.db import get_db_connection
import psycopg2.extras

# Create a Blueprint for user routes
user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/api/users', methods=['GET'])
def get_users():
    """Get all users or filter by portal."""
    portal = request.args.get('portal')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        if portal:
            cur.execute("SELECT * FROM users WHERE portal = %s", (portal,))
        else:
            cur.execute("SELECT * FROM users")
            
        users = cur.fetchall()
        
        # Convert rows to dictionaries
        result = []
        for user in users:
            user_dict = dict(user)
            # Convert roles from string to list
            user_dict['roles'] = user_dict['roles'].split(',') if user_dict['roles'] else []
            # Format dates as ISO strings
            if user_dict['created_date']:
                user_dict['createdDate'] = user_dict['created_date'].isoformat()
            if user_dict['last_login']:
                user_dict['lastLogin'] = user_dict['last_login'].isoformat()
            else:
                user_dict['lastLogin'] = None
            
            # Remove snake_case fields and keep only camelCase for frontend
            result.append({
                'id': user_dict['id'],
                'name': user_dict['name'],
                'roles': user_dict['roles'],
                'createdDate': user_dict.get('createdDate'),
                'lastLogin': user_dict.get('lastLogin'),
                'status': user_dict['status'],
                'manager': user_dict['manager'],
                'portal': user_dict['portal']
            })
        
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error fetching users: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@user_routes.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user by ID."""
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Format roles as comma-separated string
        roles = ','.join(data['roles']) if data['roles'] else ''
        
        cur.execute("""
            UPDATE users 
            SET name = %s, roles = %s, status = %s, manager = %s, portal = %s
            WHERE id = %s
            RETURNING *
        """, (data['name'], roles, data['status'], data['manager'], data['portal'], user_id))
        
        updated = cur.fetchone() is not None
        
        if updated:
            return jsonify({"success": True, "message": "User updated successfully"})
        return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        logging.error(f"Error updating user {user_id}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

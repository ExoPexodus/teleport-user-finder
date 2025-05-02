
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import psycopg2
import psycopg2.extras
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'postgres'),
        database=os.environ.get('DB_NAME', 'teleport'),
        user=os.environ.get('DB_USER', 'teleport'),
        password=os.environ.get('DB_PASSWORD', 'teleport123')
    )
    conn.autocommit = True
    return conn

@app.route('/api/users', methods=['GET'])
def get_users():
    portal = request.args.get('portal')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    if portal:
        cur.execute("SELECT * FROM users WHERE portal = %s", (portal,))
    else:
        cur.execute("SELECT * FROM users")
        
    users = cur.fetchall()
    cur.close()
    conn.close()
    
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

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Format roles as comma-separated string
    roles = ','.join(data['roles']) if data['roles'] else ''
    
    cur.execute("""
        UPDATE users 
        SET name = %s, roles = %s, status = %s, manager = %s, portal = %s
        WHERE id = %s
        RETURNING *
    """, (data['name'], roles, data['status'], data['manager'], data['portal'], user_id))
    
    updated = cur.fetchone() is not None
    
    cur.close()
    conn.close()
    
    if updated:
        return jsonify({"success": True, "message": "User updated successfully"})
    return jsonify({"success": False, "message": "User not found"}), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.environ.get('DEBUG', 'False').lower() == 'true')

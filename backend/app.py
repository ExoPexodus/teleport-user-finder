
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import psycopg2
import psycopg2.extras
from datetime import datetime
import jwt
import json
import logging
from functools import wraps
from flask_bcrypt import Bcrypt
import paramiko
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Secret key for encoding/decoding JWT
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_secret_key')

# Load the single user credentials from environment variables
AUTH_USERNAME = os.environ.get('AUTH_USERNAME')
AUTH_PASSWORD_HASH = os.environ.get('AUTH_PASSWORD_HASH')

# Load SSH credentials from environment variables
try:
    ssh_hosts_str = os.environ.get('SSH_HOSTS', '{"default":"localhost"}')
    logging.info(f"SSH_HOSTS raw value: {ssh_hosts_str}")
    SSH_HOSTS = json.loads(ssh_hosts_str)
except json.JSONDecodeError as e:
    logging.error(f"Error parsing SSH_HOSTS: {e}. Using default value.")
    SSH_HOSTS = {"default": "localhost"}

SSH_PORT = int(os.environ.get('SSH_PORT', 22))
SSH_USER = os.environ.get('SSH_USER')
SSH_KEY_PATH = os.environ.get('SSH_KEY_PATH')

# Log the SSH configuration (excluding sensitive data)
logging.info(f"Loaded SSH configuration: hosts={SSH_HOSTS}, port={SSH_PORT}, user={SSH_USER}")

def get_db_connection():
    # ... keep existing code (database connection function)
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'postgres'),
        database=os.environ.get('DB_NAME', 'teleport'),
        user=os.environ.get('DB_USER', 'teleport'),
        password=os.environ.get('DB_PASSWORD', 'teleport123')
    )
    conn.autocommit = True
    return conn

# Auth decorator to verify JWT token
def token_required(f):
    # ... keep existing code (JWT token verification decorator)
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')  # Expect token in headers
        if not token:
            logging.warning('Missing token in request')
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
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

# User management endpoints
@app.route('/api/users', methods=['GET'])
def get_users():
    # ... keep existing code (user listing functionality)
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
    # ... keep existing code (user update functionality)
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

# Teleport API routes
@app.route('/teleport/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    logging.info(f"Login attempt for user: {username}")

    if username != AUTH_USERNAME or not bcrypt.check_password_hash(AUTH_PASSWORD_HASH, password):
        logging.warning(f"Failed login attempt for user: {username}")
        return jsonify({'message': 'Invalid username or password'}), 401

    # Create JWT token
    token = jwt.encode(
        {'username': username, 'exp': datetime.utcnow() + datetime.timedelta(minutes=10)},
        app.config['SECRET_KEY'], algorithm="HS256"
    )

    logging.info(f"JWT token created for user: {username}")
    return jsonify({'token': token})

@app.route('/teleport/tkgen', methods=['GET'])
@token_required
def run_fixed_command():
    data = request.json
    if not data:
        return jsonify({'message': 'Missing JSON body'}), 400
        
    client = data.get('client')
    if not client:
        return jsonify({'message': 'Missing client parameter'}), 400

    if client not in SSH_HOSTS:
        return jsonify({'message': f"Client {client} not recognized"}), 400

    ssh_host = SSH_HOSTS[client]
    command = 'sudo tctl tokens add --ttl=5m --type=node'
    logging.info(f"Attempting to execute command via SSH: {command}")

    try:
        # Establish SSH connection
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Load the private key
        try:
            private_key = paramiko.RSAKey.from_private_key_file(SSH_KEY_PATH)
        except Exception as e:
            logging.error(f"Error loading private key: {e}")
            return jsonify({'message': f"Error loading SSH private key: {e}"}), 500

        ssh_client.connect(ssh_host, port=SSH_PORT, username=SSH_USER, pkey=private_key)
        logging.info(f"SSH connection established to {ssh_host}:{SSH_PORT}")

        # Execute command
        stdin, stdout, stderr = ssh_client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()

        ssh_client.close()
        logging.info("SSH connection closed")

        if error:
            # Check if the error message contains the specific security patch warning
            if "A security patch is available for Teleport" in error:
                logging.info("Ignoring security patch warning: No action needed.")
            else:
                logging.error(f"Error while executing command: {error}")
                return jsonify({'message': f"Error executing command: {error}"}), 500

        # Process the output to extract details
        lines = [line.strip() for line in output.strip().split('\n')]

        invite_token = None
        expiry = None
        join_command = {
            "command": "teleport start",
            "options": {}
        }
        notes = []

        # Extract invite token
        try:
            invite_token = lines[0].split(': ')[1]
        except IndexError:
            invite_token = "Not found"

        # Extract expiry
        try:
            expiry = lines[1].split('in ')[1]
        except IndexError:
            expiry = "Not found"

        # Extract command options
        try:
            command_lines = lines[5:]
            for line in command_lines:
                if '--roles=' in line:
                    join_command["options"]["roles"] = line.split('--roles=')[1].split(' ')[0]
                if '--token=' in line:
                    join_command["options"]["token"] = line.split('--token=')[1].split(' ')[0]
                if '--ca-pin=' in line:
                    join_command["options"]["ca_pin"] = line.split('--ca-pin=')[1].split(' ')[0]
                if '--auth-server=' in line:
                    join_command["options"]["auth_server"] = line.split('--auth-server=')[1].split(' ')[0]
        except IndexError:
            pass

        # Create JSON structure
        json_output = {
            "invite_token": invite_token,
            "expiry": expiry,
            "join_command": join_command,
            "notes": notes
        }

        return jsonify(json_output), 200

    except Exception as e:
        logging.error(f"Exception occurred: {str(e)}")
        return jsonify({'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# Helper route to generate a password hash - useful for initial setup
@app.route('/teleport/generate-hash', methods=['POST'])
def generate_hash():
    # This route should only be enabled in development environments
    if os.environ.get('FLASK_ENV') != 'development':
        return jsonify({'message': 'This endpoint is only available in development mode'}), 403
    
    data = request.json
    password = data.get('password')
    
    if not password:
        return jsonify({'message': 'Password is required'}), 400
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    return jsonify({'hash': hashed_password})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.environ.get('DEBUG', 'False').lower() == 'true')

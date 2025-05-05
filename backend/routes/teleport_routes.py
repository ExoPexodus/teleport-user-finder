
from flask import Blueprint, request, jsonify
import logging
from flask_bcrypt import Bcrypt
from datetime import datetime
import os
import json
from utils.auth import token_required, generate_token
from utils.ssh import execute_ssh_command
from config import AUTH_USERNAME, AUTH_PASSWORD_HASH
from models.user import User
from utils.db import get_db_session
import uuid

# Create a Blueprint for teleport routes
teleport_routes = Blueprint('teleport_routes', __name__)
bcrypt = Bcrypt()

@teleport_routes.route('/teleport/login', methods=['POST'])
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

@teleport_routes.route('/teleport/tkgen', methods=['POST'])
@token_required
def run_fixed_command():
    """Generate a teleport token."""
    data = request.json
    if not data:
        return jsonify({'message': 'Missing JSON body'}), 400
        
    client = data.get('client')
    if not client:
        return jsonify({'message': 'Missing client parameter'}), 400

    # Execute the teleport command to generate a token
    command = 'sudo tctl tokens add --ttl=5m --type=node'
    output, error = execute_ssh_command(client, command)
    
    if error:
        return jsonify({'message': error}), 500
    
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

@teleport_routes.route('/teleport/generate-hash', methods=['POST'])
def generate_hash():
    """Generate a password hash - useful for setup."""
    # This route should only be enabled in development environments
    if os.environ.get('FLASK_ENV') != 'development':
        return jsonify({'message': 'This endpoint is only available in development mode'}), 403
    
    data = request.json
    password = data.get('password')
    
    if not password:
        return jsonify({'message': 'Password is required'}), 400
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    return jsonify({'hash': hashed_password})

@teleport_routes.route('/teleport/fetch-users', methods=['POST'])
@token_required
def fetch_users_from_ssh():
    """Fetch users from Teleport servers via SSH and update the database."""
    data = request.json
    client = data.get('client')
    
    if not client:
        return jsonify({'message': 'Missing client parameter'}), 400
    
    logging.info(f"Fetching users from client: {client}")
    
    # Execute the teleport command to list users
    command = 'sudo tctl users ls --format=json'
    output, error = execute_ssh_command(client, command)
    
    if error:
        logging.error(f"Error fetching users from {client}: {error}")
        return jsonify({'success': False, 'message': f"Error fetching users: {error}"}), 500
    
    try:
        # Parse the JSON output
        users_data = json.loads(output)
        
        # Start a database session
        session = get_db_session()
        
        users_processed = 0
        users_added = 0
        users_updated = 0
        
        try:
            for user_data in users_data:
                users_processed += 1
                
                # Extract relevant information
                name = user_data.get('metadata', {}).get('name', '')
                roles = user_data.get('spec', {}).get('roles', [])
                roles_str = ','.join(roles) if roles else ''
                
                created_date_str = user_data.get('spec', {}).get('created_by', {}).get('time')
                created_date = None
                if created_date_str:
                    try:
                        created_date = datetime.fromisoformat(created_date_str.replace('Z', '+00:00'))
                    except ValueError:
                        logging.warning(f"Could not parse date: {created_date_str}")
                
                # Check if this user already exists for this portal
                existing_user = session.query(User).filter_by(name=name, portal=client).first()
                
                if existing_user:
                    # Update existing user
                    existing_user.roles = roles_str
                    if created_date:
                        existing_user.created_date = created_date
                    users_updated += 1
                    logging.info(f"Updated user {name} in portal {client}")
                else:
                    # Create new user
                    new_user = User(
                        id=str(uuid.uuid4()),
                        name=name,
                        roles=roles_str,
                        created_date=created_date or datetime.utcnow(),
                        status='active',
                        portal=client
                    )
                    session.add(new_user)
                    users_added += 1
                    logging.info(f"Added new user {name} to portal {client}")
            
            # Commit the changes
            session.commit()
            
            return jsonify({
                'success': True,
                'message': f"Successfully processed {users_processed} users: {users_added} added, {users_updated} updated",
                'client': client
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Database error while processing users: {str(e)}")
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
        finally:
            session.close()
            
    except json.JSONDecodeError as e:
        logging.error(f"Error parsing JSON output: {str(e)}")
        return jsonify({'success': False, 'message': f"Error parsing user data: {str(e)}"}), 500

from flask import Blueprint, request, jsonify
import logging
import json
from utils.auth import token_required
from utils.ssh import execute_ssh_command
from models.user import User
from utils.db import get_db_session
from sqlalchemy import and_
from datetime import datetime

# Create a Blueprint for teleport user routes
teleport_users_routes = Blueprint('teleport_users_routes', __name__)

@teleport_users_routes.route('/teleport/tkgen', methods=['POST'])
@token_required
def run_fixed_command():
    """Generate a teleport token."""
    data = request.json
    client = data.get('client')
    
    if not client:
        return jsonify({'message': "Client parameter is required"}), 400
    
    command = 'sudo tctl tokens add --ttl=5m --type=node'
    output, error = execute_ssh_command(client, command)
    
    if error:
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

@teleport_users_routes.route('/teleport/fetch-users', methods=['POST'])
@token_required
def fetch_users_from_ssh():
    """Fetch users from Teleport servers via SSH and update the database."""
    data = request.json
    client = data.get('client')
    
    if not client:
        return jsonify({'message': "Client parameter is required"}), 400
    
    # Execute the command to fetch users in JSON format
    command = 'sudo tctl users ls --format=json'
    output, error = execute_ssh_command(client, command)
    
    if error:
        return jsonify({'message': f"Error executing command: {error}"}), 500
    
    try:
        # Parse the JSON output
        users_data = json.loads(output)
        
        # Get database session
        db_session = get_db_session()
        
        # Process each user
        user_count = 0
        new_user_count = 0
        updated_user_count = 0
        
        for user_data in users_data:
            if user_data.get('kind') == 'user':
                name = user_data.get('metadata', {}).get('name')
                roles = user_data.get('spec', {}).get('roles', [])
                
                if name:
                    # Check if this user exists with the same portal
                    existing_user = db_session.query(User).filter(
                        and_(User.name == name, User.portal == client)
                    ).first()
                    
                    # Determine user status based on roles - if 'inactive_role' is present, mark as inactive
                    status = 'inactive' if 'inactive_role' in roles else 'active'
                    
                    if existing_user:
                        # Update existing user's roles and status
                        existing_user.roles = ','.join(roles)
                        existing_user.status = status
                        updated_user_count += 1
                    else:
                        # Create new user
                        created_date = user_data.get('spec', {}).get('created_by', {}).get('time')
                        try:
                            created_date_obj = datetime.strptime(created_date, "%Y-%m-%dT%H:%M:%S.%fZ") if created_date else datetime.utcnow()
                        except ValueError:
                            created_date_obj = datetime.utcnow()
                        
                        manager = user_data.get('spec', {}).get('created_by', {}).get('user', {}).get('name')
                        
                        new_user = User(
                            id=f"{name.replace('@', '_at_')}_{client}",
                            name=name,
                            roles=','.join(roles),
                            created_date=created_date_obj,
                            last_login=None,
                            status=status,  # Set status based on roles
                            manager=manager,
                            portal=client
                        )
                        db_session.add(new_user)
                        new_user_count += 1
                    
                    user_count += 1
        
        # Commit changes
        db_session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Successfully processed {user_count} users from {client} portal. Added {new_user_count} new users and updated {updated_user_count} existing users."
        }), 200
        
    except json.JSONDecodeError:
        return jsonify({'message': "Error parsing JSON output from SSH command"}), 500
    except Exception as e:
        db_session.rollback()
        logging.error(f"Error processing users: {str(e)}")
        return jsonify({'message': f"Error processing users: {str(e)}"}), 500
    finally:
        db_session.close()

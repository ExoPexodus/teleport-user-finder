
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
    # ... keep existing code (token generation functionality)

@teleport_routes.route('/teleport/generate-hash', methods=['POST'])
def generate_hash():
    """Generate a password hash - useful for setup."""
    # ... keep existing code (password hash generation)

@teleport_routes.route('/teleport/fetch-users', methods=['POST'])
@token_required
def fetch_users_from_ssh():
    """Fetch users from Teleport servers via SSH and update the database."""
    # ... keep existing code (fetch users from SSH functionality)

@teleport_routes.route('/teleport/schedule-role-change', methods=['POST'])
@token_required
def schedule_role_change():
    """Schedule a role change for a user at a specific time."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Missing request data'}), 400
    
    required_fields = ['userId', 'userName', 'portal', 'scheduledTime', 'action', 'roles']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    user_id = data['userId']
    user_name = data['userName']
    portal = data['portal']
    scheduled_time_str = data['scheduledTime']
    action = data['action']  # 'add' or 'remove'
    roles = data['roles']
    
    try:
        # Parse the scheduled time
        scheduled_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
        
        # Create a new scheduled task in the database
        session = get_db_session()
        try:
            # Get the current user data to know their current roles
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Create a scheduled task record
            # This is simplified - you would typically have a ScheduledTask model
            scheduled_task = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_name": user_name,
                "portal": portal,
                "scheduled_time": scheduled_time.isoformat(),
                "action": action,
                "roles": roles,
                "status": "scheduled"
            }
            
            # In a real implementation, you would save this to a database table
            # For now, log it
            logging.info(f"Created scheduled task: {json.dumps(scheduled_task)}")
            
            # Return success response
            return jsonify({
                'success': True,
                'message': f"Role change scheduled for {user_name} on {scheduled_time_str}",
                'task_id': scheduled_task['id']
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Database error while scheduling task: {str(e)}")
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
        finally:
            session.close()
            
    except ValueError as e:
        logging.error(f"Invalid datetime format: {scheduled_time_str}, error: {str(e)}")
        return jsonify({'success': False, 'message': 'Invalid datetime format'}), 400

@teleport_routes.route('/teleport/execute-role-change', methods=['POST'])
@token_required
def execute_role_change():
    """Execute a role change for a user."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Missing request data'}), 400
    
    required_fields = ['taskId', 'userName', 'portal', 'action', 'roles']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    task_id = data['taskId']
    user_name = data['userName']
    portal = data['portal']
    action = data['action']  # 'add' or 'remove'
    roles_to_change = data['roles']
    
    try:
        # Get the current user from database to know their current roles
        session = get_db_session()
        try:
            user = session.query(User).filter_by(name=user_name, portal=portal).first()
            if not user:
                return jsonify({'success': False, 'message': 'User not found in specified portal'}), 404
            
            # Get current roles as a list
            current_roles = user.roles.split(',') if user.roles else []
            
            # Calculate new roles based on action
            if action == 'add':
                # Add roles that aren't already present
                new_roles = current_roles + [r for r in roles_to_change if r not in current_roles]
            else:  # remove
                # Remove specified roles
                new_roles = [r for r in current_roles if r not in roles_to_change]
            
            # Join roles into comma-separated string for command
            roles_str = ','.join(new_roles)
            
            # Execute the command via SSH
            command = f"tctl users update --set-roles {roles_str} {user_name}"
            output, error = execute_ssh_command(portal, command)
            
            if error:
                logging.error(f"Error executing role change: {error}")
                return jsonify({'success': False, 'message': f"Error executing role change: {error}"}), 500
            
            # Update user in database
            user.roles = ','.join(new_roles)
            session.commit()
            
            # Update task status (in a real app)
            logging.info(f"Task {task_id} completed successfully")
            
            return jsonify({
                'success': True,
                'message': f"Roles updated for {user_name}",
                'output': output
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error during role execution: {str(e)}")
            return jsonify({'success': False, 'message': f"Execution error: {str(e)}"}), 500
        finally:
            session.close()
            
    except Exception as e:
        logging.error(f"General error: {str(e)}")
        return jsonify({'success': False, 'message': f"Error: {str(e)}"}), 500

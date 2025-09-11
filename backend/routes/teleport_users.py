
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
    
    command = 'sudo tctl tokens add --ttl=30m --type=node'
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
        
        # Get existing users from database for this portal
        existing_db_users = db_session.query(User).filter(User.portal == client).all()
        existing_db_user_names = {user.name for user in existing_db_users}
        
        # Get users from portal
        portal_user_names = set()
        user_count = 0
        new_user_count = 0
        updated_user_count = 0
        
        for user_data in users_data:
            if user_data.get('kind') == 'user':
                name = user_data.get('metadata', {}).get('name')
                roles = user_data.get('spec', {}).get('roles', [])
                
                if name:
                    portal_user_names.add(name)
                    user_id = f"{name.replace('@', '_at_')}_{client}"
                    
                    # Check if this user exists by ID first, then by name+portal as fallback
                    existing_user = db_session.query(User).filter(User.id == user_id).first()
                    if not existing_user:
                        # Fallback check by name and portal (for legacy data)
                        existing_user = db_session.query(User).filter(
                            and_(User.name == name, User.portal == client)
                        ).first()
                        # If found by name+portal but different ID, update the ID
                        if existing_user:
                            existing_user.id = user_id
                    
                    if existing_user:
                        # Update existing user's roles and status
                        existing_user.roles = ','.join(roles)
                        existing_user.status = 'active'  # Mark as active since they exist in portal
                        existing_user.name = name  # Ensure name is current
                        existing_user.portal = client  # Ensure portal is current
                        updated_user_count += 1
                    else:
                        # Create new user only if it doesn't exist
                        created_date = user_data.get('spec', {}).get('created_by', {}).get('time')
                        try:
                            created_date_obj = datetime.strptime(created_date, "%Y-%m-%dT%H:%M:%S.%fZ") if created_date else datetime.utcnow()
                        except ValueError:
                            created_date_obj = datetime.utcnow()
                        
                        manager = user_data.get('spec', {}).get('created_by', {}).get('user', {}).get('name')
                        
                        new_user = User(
                            id=user_id,
                            name=name,
                            roles=','.join(roles),
                            created_date=created_date_obj,
                            last_login=None,
                            status='active',
                            manager=manager,
                            portal=client
                        )
                        db_session.add(new_user)
                        new_user_count += 1
                    
                    user_count += 1
        
        # Identify orphaned users (in DB but not in portal)
        orphaned_user_names = existing_db_user_names - portal_user_names
        orphaned_users = []
        
        for user in existing_db_users:
            if user.name in orphaned_user_names:
                orphaned_users.append({
                    'id': user.id,
                    'name': user.name,
                    'roles': user.roles.split(',') if user.roles else [],
                    'createdDate': user.created_date.isoformat() if user.created_date else None,
                    'lastLogin': user.last_login.isoformat() if user.last_login else None,
                    'status': user.status,
                    'manager': user.manager,
                    'portal': user.portal
                })
        
        # Commit changes
        db_session.commit()
        
        response_data = {
            'success': True,
            'message': f"Successfully processed {user_count} users from {client} portal. Added {new_user_count} new users and updated {updated_user_count} existing users.",
            'orphaned_users': orphaned_users
        }
        
        return jsonify(response_data), 200
        
    except json.JSONDecodeError:
        return jsonify({'message': "Error parsing JSON output from SSH command"}), 500
    except Exception as e:
        db_session.rollback()
        logging.error(f"Error processing users: {str(e)}")
        return jsonify({'message': f"Error processing users: {str(e)}"}), 500
    finally:
        db_session.close()

@teleport_users_routes.route('/teleport/manage-orphaned-users', methods=['POST'])
@token_required
def manage_orphaned_users():
    """Manage orphaned users (users in DB but not in portal)."""
    data = request.json
    portal = data.get('portal')
    action = data.get('action')  # 'keep_all', 'delete_all', 'selective'
    user_ids_to_keep = data.get('user_ids_to_keep', [])
    
    if not portal or not action:
        return jsonify({'message': "Portal and action parameters are required"}), 400
    
    db_session = get_db_session()
    
    try:
        if action == 'keep_all':
            # Mark all orphaned users as inactive but keep them
            # We need the specific orphaned user IDs passed from frontend
            orphaned_user_ids = data.get('orphaned_user_ids', [])
            if orphaned_user_ids:
                updated_count = db_session.query(User).filter(
                    and_(User.portal == portal, User.id.in_(orphaned_user_ids))
                ).update({'status': 'inactive'}, synchronize_session=False)
                db_session.commit()
                
                return jsonify({
                    'success': True,
                    'message': f"Marked {updated_count} orphaned users in {portal} portal as inactive"
                }), 200
            else:
                return jsonify({'message': "No orphaned user IDs provided"}), 400
            
        elif action == 'delete_all':
            # Delete ONLY the orphaned users for this portal - NOT ALL USERS
            orphaned_user_ids = data.get('orphaned_user_ids', [])
            if orphaned_user_ids:
                deleted_count = db_session.query(User).filter(
                    and_(User.portal == portal, User.id.in_(orphaned_user_ids))
                ).delete(synchronize_session=False)
                db_session.commit()
                
                return jsonify({
                    'success': True,
                    'message': f"Deleted {deleted_count} orphaned users from {portal} portal"
                }), 200
            else:
                return jsonify({'message': "No orphaned user IDs provided"}), 400
            
        elif action == 'selective':
            # Delete users not in the keep list (from orphaned users only)
            orphaned_user_ids = data.get('orphaned_user_ids', [])
            users_to_delete = [user_id for user_id in orphaned_user_ids if user_id not in user_ids_to_keep]
            
            if users_to_delete:
                deleted_count = db_session.query(User).filter(User.id.in_(users_to_delete)).delete()
                db_session.commit()
                
                # Mark kept users as inactive
                for user_id in user_ids_to_keep:
                    user = db_session.query(User).filter(User.id == user_id).first()
                    if user:
                        user.status = 'inactive'
                db_session.commit()
                
                return jsonify({
                    'success': True,
                    'message': f"Deleted {deleted_count} users and kept {len(user_ids_to_keep)} users as inactive"
                }), 200
            else:
                # Just mark kept users as inactive
                for user_id in user_ids_to_keep:
                    user = db_session.query(User).filter(User.id == user_id).first()
                    if user:
                        user.status = 'inactive'
                db_session.commit()
                
                return jsonify({
                    'success': True,
                    'message': f"Kept {len(user_ids_to_keep)} users as inactive"
                }), 200
        else:
            return jsonify({'message': "Invalid action. Use 'keep_all', 'delete_all', or 'selective'"}), 400
            
    except Exception as e:
        db_session.rollback()
        logging.error(f"Error managing orphaned users: {str(e)}")
        return jsonify({'message': f"Error managing orphaned users: {str(e)}"}), 500
    finally:
        db_session.close()

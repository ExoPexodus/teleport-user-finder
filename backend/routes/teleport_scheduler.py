from flask import Blueprint, request, jsonify
import logging
from datetime import datetime
import json
import uuid
from utils.auth import token_required
from utils.ssh import execute_ssh_command
from models.user import User
from models.scheduled_task import ScheduledTask
from utils.db import get_db_session

# Create a Blueprint for teleport scheduler routes
teleport_scheduler_routes = Blueprint('teleport_scheduler_routes', __name__)

@teleport_scheduler_routes.route('/teleport/schedule-role-change', methods=['POST'])
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
            task_id = str(uuid.uuid4())
            scheduled_task = ScheduledTask(
                id=task_id,
                user_id=user_id,
                user_name=user_name,
                portal=portal,
                scheduled_time=scheduled_time,
                action=action,
                roles=','.join(roles),
                status='scheduled'
            )
            session.add(scheduled_task)
            session.commit()
            
            # Return success response
            return jsonify({
                'success': True,
                'message': f"Role change scheduled for {user_name} on {scheduled_time_str}",
                'task_id': task_id
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

def execute_task_internal(data):
    """Internal function to execute a role change task without requiring an HTTP request.
    This is used by the task scheduler.
    
    Args:
        data: Dictionary containing taskId, userName, portal, action, and roles.
        
    Returns:
        Dictionary with success status and message.
    """
    try:
        task_id = data['taskId']
        user_name = data['userName']
        portal = data['portal']
        action = data['action']
        roles_to_change = data['roles']
        
        # Get the current user from database to know their current roles
        session = get_db_session()
        try:
            user = session.query(User).filter_by(name=user_name, portal=portal).first()
            if not user:
                return {'success': False, 'message': 'User not found in specified portal'}
            
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
            command = f"sudo tctl users update --set-roles {roles_str} {user_name}"
            output, error = execute_ssh_command(portal, command)
            
            if error:
                logging.error(f"Error executing role change: {error}")
                
                # Update task status to failed
                task = session.query(ScheduledTask).filter_by(id=task_id).first()
                if task:
                    task.status = 'failed'
                    task.executed_at = datetime.now()
                    task.result = error
                    session.commit()
                
                return {'success': False, 'message': f"Error executing role change: {error}"}
            
            # Update user in database
            user.roles = ','.join(new_roles)
            
            # Update task status
            task = session.query(ScheduledTask).filter_by(id=task_id).first()
            if task:
                task.status = 'completed'
                task.executed_at = datetime.now()
                task.result = output
            
            session.commit()
            
            logging.info(f"Task {task_id} completed successfully")
            
            return {
                'success': True,
                'message': f"Roles updated for {user_name}",
                'output': output
            }
        
        except Exception as e:
            session.rollback()
            logging.error(f"Error during role execution: {str(e)}")
            
            # Try to update task status to failed
            try:
                task = session.query(ScheduledTask).filter_by(id=task_id).first()
                if task:
                    task.status = 'failed'
                    task.executed_at = datetime.now()
                    task.result = str(e)
                    session.commit()
            except:
                pass
                
            return {'success': False, 'message': f"Execution error: {str(e)}"}
        finally:
            session.close()
            
    except Exception as e:
        logging.error(f"General error in execute_task_internal: {str(e)}")
        return {'success': False, 'message': f"Error: {str(e)}"}

@teleport_scheduler_routes.route('/teleport/execute-role-change', methods=['POST'])
@token_required
def execute_role_change():
    """Execute a role change for a user."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Missing request data'}), 400
    
    # Process the data through the internal function
    result = execute_task_internal(data)
    
    # Convert the result to a proper HTTP response
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 500

@teleport_scheduler_routes.route('/teleport/execute-role-change-immediate', methods=['POST'])
@token_required
def execute_role_change_immediate():
    """Execute a role change for a user immediately without scheduling."""
    data = request.json
    if not data:
        return jsonify({'success': False, 'message': 'Missing request data'}), 400
    
    required_fields = ['userId', 'userName', 'portal', 'action', 'roles']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
    
    user_id = data['userId']
    user_name = data['userName']
    portal = data['portal']
    action = data['action']  # 'add' or 'remove'
    roles_to_change = data['roles']
    
    try:
        # Get the current user from database to know their current roles
        session = get_db_session()
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
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
            command = f"sudo tctl users update --set-roles {roles_str} {user_name}"
            output, error = execute_ssh_command(portal, command)
            
            if error:
                logging.error(f"Error executing immediate role change: {error}")
                return jsonify({'success': False, 'message': f"Error executing role change: {error}"}), 500
            
            # Update user in database
            user.roles = ','.join(new_roles)
            session.commit()
            
            # Create a completed task record for auditing
            task_id = str(uuid.uuid4())
            now = datetime.now()
            scheduled_task = ScheduledTask(
                id=task_id,
                user_id=user_id,
                user_name=user_name,
                portal=portal,
                scheduled_time=now,
                action=action,
                roles=','.join(roles_to_change),
                status='completed',
                executed_at=now,
                result=output
            )
            session.add(scheduled_task)
            session.commit()
            
            logging.info(f"Immediate role change for {user_name} completed successfully")
            
            return jsonify({
                'success': True,
                'message': f"Roles updated for {user_name}",
                'output': output
            })
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error during immediate role execution: {str(e)}")
            return jsonify({'success': False, 'message': f"Execution error: {str(e)}"}), 500
        finally:
            session.close()
            
    except Exception as e:
        logging.error(f"General error: {str(e)}")
        return jsonify({'success': False, 'message': f"Error: {str(e)}"}), 500

@teleport_scheduler_routes.route('/teleport/scheduled-jobs', methods=['GET'])
@token_required
def get_scheduled_jobs():
    """Get all scheduled jobs."""
    try:
        session = get_db_session()
        try:
            # Query all scheduled tasks
            tasks = session.query(ScheduledTask).all()
            
            # Convert to list of dictionaries
            result = []
            for task in tasks:
                result.append({
                    'id': task.id,
                    'userId': task.user_id,
                    'userName': task.user_name,
                    'portal': task.portal,
                    'scheduledTime': task.scheduled_time.isoformat(),
                    'action': task.action,
                    'roles': task.roles.split(',') if task.roles else [],
                    'status': task.status,
                    'createdAt': task.created_at.isoformat() if task.created_at else None,
                    'executedAt': task.executed_at.isoformat() if task.executed_at else None,
                    'result': task.result
                })
            
            return jsonify(result)
            
        except Exception as e:
            logging.error(f"Database error while fetching scheduled tasks: {str(e)}")
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
        finally:
            session.close()
            
    except Exception as e:
        logging.error(f"General error: {str(e)}")
        return jsonify({'success': False, 'message': f"Error: {str(e)}"}), 500

@teleport_scheduler_routes.route('/teleport/available-roles', methods=['GET'])
@token_required
def get_available_roles():
    """Get all available roles for a portal."""
    portal = request.args.get('portal')
    if not portal:
        return jsonify({'success': False, 'message': 'Missing portal parameter'}), 400
    
    try:
        session = get_db_session()
        try:
            # Query all users in the portal and collect their roles
            users = session.query(User).filter_by(portal=portal).all()
            
            # Extract and deduplicate all roles
            all_roles = set()
            for user in users:
                if user.roles:
                    roles = user.roles.split(',')
                    all_roles.update(roles)
            
            # Sort alphabetically for consistent presentation
            sorted_roles = sorted(list(all_roles))
            
            return jsonify(sorted_roles)
            
        except Exception as e:
            logging.error(f"Database error while fetching available roles: {str(e)}")
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
        finally:
            session.close()
            
    except Exception as e:
        logging.error(f"General error: {str(e)}")
        return jsonify({'success': False, 'message': f"Error: {str(e)}"}), 500

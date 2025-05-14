
import logging
import uuid
from datetime import datetime
from models.admin_user import AdminUser
from utils.db import get_db_session

logger = logging.getLogger(__name__)

def sync_admin_user(keycloak_data):
    """
    Sync Keycloak admin user with local database.
    Creates or updates admin user based on Keycloak data.
    """
    if not keycloak_data:
        logger.error("No Keycloak data provided")
        return None
        
    keycloak_id = keycloak_data.get('sub')
    if not keycloak_id:
        logger.error("No Keycloak ID found in token data")
        return None
    
    session = get_db_session()
    
    try:
        # Try to find admin user by keycloak_id
        admin_user = session.query(AdminUser).filter_by(keycloak_id=keycloak_id).first()
        
        # Extract user information from Keycloak data
        username = keycloak_data.get('preferred_username', '')
        email = keycloak_data.get('email', '')
        given_name = keycloak_data.get('given_name', '')
        family_name = keycloak_data.get('family_name', '')
        
        # Get roles from realm_access and other possible sources in Keycloak
        roles_list = keycloak_data.get('realm_access', {}).get('roles', [])
        
        # You can also add client-specific roles if needed
        client_id = "your-client-id"  # Replace with your actual client ID if needed
        client_roles = keycloak_data.get('resource_access', {}).get(client_id, {}).get('roles', [])
        if client_roles:
            roles_list.extend(client_roles)
            
        # Filter out default roles that shouldn't affect permissions
        filtered_roles = [r for r in roles_list if r not in ['uma_authorization', 'offline_access', 'default-roles']]
        roles = ','.join(filtered_roles) if filtered_roles else ''
        
        if admin_user:
            # Update existing admin user
            admin_user.username = username
            admin_user.email = email
            admin_user.roles = roles
            admin_user.given_name = given_name
            admin_user.family_name = family_name
            admin_user.last_login = datetime.utcnow()
            logger.info(f"Updated admin user: {username}, roles: {roles}")
        else:
            # Create new admin user
            admin_user = AdminUser(
                id=str(uuid.uuid4()),
                keycloak_id=keycloak_id,
                username=username,
                email=email,
                roles=roles,
                given_name=given_name,
                family_name=family_name,
                created_date=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            session.add(admin_user)
            logger.info(f"Created new admin user: {username}, roles: {roles}")
        
        session.commit()
        return admin_user
    except Exception as e:
        session.rollback()
        logger.error(f"Error syncing admin user: {e}")
        return None
    finally:
        session.close()

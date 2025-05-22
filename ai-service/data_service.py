
import requests
import logging
from config import BACKEND_URL

logger = logging.getLogger(__name__)

async def get_application_data():
    """Fetch all relevant application data to provide context to the AI"""
    try:
        data = {}
        
        # Fetch users
        users_response = requests.get(f"{BACKEND_URL}/api/users")
        if users_response.status_code == 200:
            users_data = users_response.json()
            
            # Count active and inactive users
            active_users = sum(1 for user in users_data if user.get('status') == 'active')
            inactive_users = sum(1 for user in users_data if user.get('status') == 'inactive')
            
            data["users"] = users_data
            data["user_stats"] = {
                "total": len(users_data),
                "active": active_users,
                "inactive": inactive_users
            }
            
        # Fetch scheduled jobs
        jobs_response = requests.get(f"{BACKEND_URL}/teleport/scheduled-jobs")
        if jobs_response.status_code == 200:
            data["scheduled_jobs"] = jobs_response.json()
            
        return data
    except Exception as e:
        logger.error(f"Error fetching application data: {e}")
        return {"error": str(e)}


import os
import json
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Secret key for encoding/decoding JWT
SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')

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

# Database configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'postgres'),
    'database': os.environ.get('DB_NAME', 'teleport'),
    'user': os.environ.get('DB_USER', 'teleport'),
    'password': os.environ.get('DB_PASSWORD', 'teleport123')
}

# Keycloak configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://keycloak:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'teleport')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', 'teleport-client')
KEYCLOAK_CLIENT_SECRET = os.environ.get('KEYCLOAK_CLIENT_SECRET', '')

# Frontend URL for SSO callback
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:8888')

# Environment settings
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'


import paramiko
import logging
from backend.config import SSH_HOSTS, SSH_PORT, SSH_USER, SSH_KEY_PATH

def execute_ssh_command(client, command):
    """Execute command via SSH on the specified client."""
    if client not in SSH_HOSTS:
        logging.error(f"Client {client} not recognized")
        return None, f"Client {client} not recognized"

    ssh_host = SSH_HOSTS[client]
    logging.info(f"Attempting to execute command via SSH on {ssh_host}: {command}")

    try:
        # Establish SSH connection
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Load the private key
        try:
            private_key = paramiko.RSAKey.from_private_key_file(SSH_KEY_PATH)
        except Exception as e:
            logging.error(f"Error loading private key: {e}")
            return None, f"Error loading SSH private key: {e}"

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
                return None, error

        return output, None
    except Exception as e:
        logging.error(f"SSH exception occurred: {str(e)}")
        return None, str(e)

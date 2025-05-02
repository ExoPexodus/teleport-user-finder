
# Teleport User Management System

This application provides a user management interface for teleport users and includes API endpoints for teleport token generation.

## Setup

### Environment Variables

For the teleport API functionality, you need to set the following environment variables:

```sh
# Authentication
SECRET_KEY=your_jwt_secret_key
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=your_bcrypt_hash  # Generate using the steps below

# SSH Configuration
SSH_HOSTS='{"client1":"hostname1","client2":"hostname2"}'
SSH_PORT=22
SSH_USER=teleport
SSH_KEY_PATH=/app/ssh_key
SSH_KEY_LOCAL_PATH=./path/to/your/ssh_key  # Path to SSH key on host machine
```

### Generating Password Hash

To generate a password hash for `AUTH_PASSWORD_HASH`:

1. In development mode, use the `/teleport/generate-hash` endpoint:
   ```
   POST /teleport/generate-hash
   {"password": "your_secure_password"}
   ```

2. Or use a Python script:
   ```python
   from flask_bcrypt import Bcrypt
   bcrypt = Bcrypt()
   password = "your_secure_password"
   hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
   print(hashed_password)
   ```

## API Usage

### Authentication

```
POST /teleport/login
{
  "username": "admin",
  "password": "your_password"
}
```

Response:
```
{
  "token": "jwt_token_here"
}
```

### Generate Teleport Node Token

```
GET /teleport/tkgen
Headers: {
  "x-access-token": "your_jwt_token",
  "Content-Type": "application/json"
}
Body: {
  "client": "client1"  # Must match a key in SSH_HOSTS
}
```

Response:
```
{
  "invite_token": "token_value",
  "expiry": "5m0s",
  "join_command": {
    "command": "teleport start",
    "options": {
      "roles": "node",
      "token": "token_value",
      "ca_pin": "sha256:pin_value",
      "auth_server": "server:3025"
    }
  },
  "notes": []
}
```

## User Management

- GET /api/users - List all users
- GET /api/users?portal=name - List users filtered by portal
- PUT /api/users/{id} - Update user information

## Running with Docker Compose

```
docker-compose up -d
```

This will start the frontend, backend, and PostgreSQL database.

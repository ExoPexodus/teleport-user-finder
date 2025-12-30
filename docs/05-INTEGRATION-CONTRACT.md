# Integration Contract Document

## Overview

This document defines the API contracts, data formats, and integration specifications for the Teleport User Management System. It serves as the definitive reference for all system interfaces.

---

## API Base Information

| Property | Value |
|----------|-------|
| Base URL | `/teleportui` |
| API Version | v1 (implicit) |
| Authentication | JWT Bearer Token |
| Content-Type | `application/json` |
| Token Header | `x-access-token` |

---

## Authentication Endpoints

### POST /teleport/login

Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid username or password"
}
```

**Token Payload:**
```json
{
  "user": "admin",
  "exp": 1735689600
}
```

---

## User Management Endpoints

### GET /api/users

Retrieves all users or filters by portal.

**Headers:**
```
x-access-token: <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `portal` | string | No | Filter by portal name |

**Response (200 OK):**
```json
[
  {
    "id": "john_at_corp.com_kocharsoft",
    "name": "john@corp.com",
    "roles": ["admin", "developer"],
    "createdDate": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-12-01T08:00:00Z",
    "status": "active",
    "manager": "admin@corp.com",
    "portal": "kocharsoft"
  }
]
```

**Response (403 Forbidden):**
```json
{
  "message": "Token is missing"
}
```

```json
{
  "message": "Token has expired"
}
```

---

### PUT /api/users/{id}

Updates a user's information.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Request Body:**
```json
{
  "id": "john_at_corp.com_kocharsoft",
  "name": "john@corp.com",
  "roles": ["admin", "developer", "superuser"],
  "status": "active",
  "manager": "admin@corp.com",
  "portal": "kocharsoft"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### DELETE /api/users

Deletes multiple users.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": [
    "john_at_corp.com_kocharsoft",
    "jane_at_corp.com_igzy"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Teleport Sync Endpoints

### POST /teleport/fetch-users

Fetches users from a Teleport portal via SSH and syncs to database.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "client": "kocharsoft"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully processed 50 users from kocharsoft portal. Added 5 new users and updated 45 existing users.",
  "orphaned_users": [
    {
      "id": "old_at_corp.com_kocharsoft",
      "name": "old@corp.com",
      "roles": ["viewer"],
      "createdDate": "2023-06-01T00:00:00Z",
      "lastLogin": null,
      "status": "active",
      "manager": null,
      "portal": "kocharsoft"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Client parameter is required"
}
```

**Response (500 Internal Server Error):**
```json
{
  "message": "Error executing command: SSH connection failed"
}
```

---

### POST /teleport/manage-orphaned-users

Manages orphaned users (users in DB but not in portal).

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "portal": "kocharsoft",
  "action": "selective",
  "orphaned_user_ids": ["old1_kocharsoft", "old2_kocharsoft"],
  "user_ids_to_keep": ["old1_kocharsoft"]
}
```

**Action Values:**
| Action | Description |
|--------|-------------|
| `keep_all` | Mark all orphaned users as inactive |
| `delete_all` | Delete all orphaned users |
| `selective` | Keep specified users, delete others |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Deleted 1 users and kept 1 users as inactive"
}
```

---

### POST /teleport/tkgen

Generates a Teleport node join token.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "client": "kocharsoft"
}
```

**Response (200 OK):**
```json
{
  "invite_token": "abc123def456",
  "expiry": "30m0s",
  "join_command": {
    "command": "teleport start",
    "options": {
      "roles": "node",
      "token": "abc123def456",
      "ca_pin": "sha256:xyz789",
      "auth_server": "teleport.example.com:3025"
    }
  },
  "notes": []
}
```

---

## Role Scheduling Endpoints

### POST /teleport/schedule-role-change

Schedules a role change for future execution.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "john_at_corp.com_kocharsoft",
  "userName": "john@corp.com",
  "portal": "kocharsoft",
  "scheduledTime": "2024-12-31T09:00:00Z",
  "action": "add",
  "roles": ["superadmin"]
}
```

**Action Values:**
| Action | Description |
|--------|-------------|
| `add` | Add specified roles to user |
| `remove` | Remove specified roles from user |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role change scheduled for john@corp.com on 2024-12-31T09:00:00Z",
  "task_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### POST /teleport/execute-role-change-immediate

Executes a role change immediately.

**Headers:**
```
x-access-token: <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "john_at_corp.com_kocharsoft",
  "userName": "john@corp.com",
  "portal": "kocharsoft",
  "action": "add",
  "roles": ["superadmin"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Roles updated for john@corp.com",
  "output": "User john@corp.com has been updated"
}
```

---

### GET /teleport/scheduled-jobs

Retrieves all scheduled jobs.

**Headers:**
```
x-access-token: <jwt_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "john_at_corp.com_kocharsoft",
    "userName": "john@corp.com",
    "portal": "kocharsoft",
    "scheduledTime": "2024-12-31T09:00:00Z",
    "action": "add",
    "roles": ["superadmin"],
    "status": "scheduled",
    "createdAt": "2024-12-01T10:00:00Z",
    "executedAt": null,
    "result": null
  }
]
```

---

### GET /teleport/available-roles

Gets all available roles for a portal.

**Headers:**
```
x-access-token: <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `portal` | string | Yes | Portal name |

**Response (200 OK):**
```json
["admin", "auditor", "developer", "superadmin", "viewer"]
```

---

## Health Check Endpoint

### GET /health

Health check endpoint (no authentication required).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00.000Z"
}
```

---

## Data Type Definitions

### User Object

```typescript
interface User {
  id: string;              // Unique identifier
  name: string;            // User's email/name
  roles: string[];         // Array of role names
  createdDate: string;     // ISO 8601 datetime
  lastLogin: string | null;// ISO 8601 datetime or null
  status: 'active' | 'inactive' | 'pending';
  manager: string | null;  // Manager's name/email
  portal: 'kocharsoft' | 'igzy' | 'maxicus' | null;
}
```

### RoleChangeSchedule Object

```typescript
interface RoleChangeSchedule {
  id?: string;             // UUID (optional for creation)
  userId: string;          // Reference to user
  userName: string;        // User's display name
  portal: string;          // Target portal
  scheduledTime: string;   // ISO 8601 datetime
  action: 'add' | 'remove';// Operation type
  roles: string[];         // Roles to add/remove
  status?: string;         // Task status
  executedAt?: string;     // Execution timestamp
  result?: string;         // Execution result/error
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Human-readable error description",
  "success": false  // Optional, included in some responses
}
```

### Common Error Codes

| HTTP Code | Meaning | Common Causes |
|-----------|---------|---------------|
| 400 | Bad Request | Missing required parameters |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Missing/expired token |
| 404 | Not Found | User/resource not found |
| 500 | Server Error | SSH failure, database error |

---

## SSH Command Integration

### Commands Executed

| Feature | SSH Command |
|---------|-------------|
| Fetch Users | `sudo tctl users ls --format=json` |
| Update Roles | `sudo tctl users update --set-roles {roles} {username}` |
| Generate Token | `sudo tctl tokens add --ttl=30m --type=node` |

### SSH Configuration

The system connects to Teleport servers using these environment variables:

```bash
SSH_HOSTS='{"kocharsoft":"host1.example.com","igzy":"host2.example.com"}'
SSH_PORT=22
SSH_USER=teleport
SSH_KEY_PATH=/app/ssh_key
```

---

## Rate Limits

Currently, no rate limits are enforced. Future versions may include:

| Endpoint Category | Suggested Limit |
|------------------|-----------------|
| Authentication | 10 requests/minute |
| User Operations | 100 requests/minute |
| SSH Operations | 10 requests/minute |

---

## Versioning

The API currently does not use explicit versioning. Future breaking changes will be communicated via:

1. API version prefix (e.g., `/api/v2/`)
2. Deprecation headers
3. Migration documentation

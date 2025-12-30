# Workflow Engine Design Document

## Overview

The Teleport User Management System includes a custom-built workflow engine that handles scheduled role changes for users. This engine runs as a background thread within the Flask application, periodically checking for and executing due tasks.

---

## Architecture

### High-Level Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       WORKFLOW ENGINE ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        TASK SCHEDULER                                │  │
│  │                                                                      │  │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │  │
│  │  │  Background      │    │   Task Queue     │    │   Executor   │  │  │
│  │  │  Thread          │───►│   (Database)     │───►│   Module     │  │  │
│  │  │  (60s interval)  │    │                  │    │              │  │  │
│  │  └──────────────────┘    └──────────────────┘    └──────┬───────┘  │  │
│  │                                                         │          │  │
│  │                                                         ▼          │  │
│  │                                               ┌──────────────────┐ │  │
│  │                                               │   SSH Module     │ │  │
│  │                                               │   (Paramiko)     │ │  │
│  │                                               └──────────────────┘ │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. TaskScheduler Class

The central component of the workflow engine.

```python
class TaskScheduler:
    def __init__(self, check_interval=60):
        self.check_interval = check_interval  # Seconds between checks
        self.running = False
        self.thread = None
        self.logger = logging.getLogger('TaskScheduler')
```

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `start()` | Initializes and starts the background thread |
| `stop()` | Gracefully stops the scheduler |
| `_run()` | Main loop - checks for due tasks periodically |
| `_check_and_execute_due_tasks()` | Queries and processes due tasks |
| `_execute_task()` | Executes a specific task |

### 2. Execution Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        TASK EXECUTION FLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  START                                                                     │
│    │                                                                       │
│    ▼                                                                       │
│  ┌─────────────────────┐                                                  │
│  │ Check Interval      │◄────────────────────────────────────────┐       │
│  │ (Every 60 seconds)  │                                         │       │
│  └──────────┬──────────┘                                         │       │
│             │                                                     │       │
│             ▼                                                     │       │
│  ┌─────────────────────┐                                         │       │
│  │ Query Database      │                                         │       │
│  │ WHERE status =      │                                         │       │
│  │ 'scheduled' AND     │                                         │       │
│  │ scheduled_time <= NOW│                                         │       │
│  └──────────┬──────────┘                                         │       │
│             │                                                     │       │
│             ▼                                                     │       │
│  ┌─────────────────────┐     NO                                  │       │
│  │  Tasks Found?       │─────────────────────────────────────────┘       │
│  └──────────┬──────────┘                                                 │
│             │ YES                                                         │
│             ▼                                                             │
│  ┌─────────────────────┐                                                 │
│  │ FOR EACH Task:      │                                                 │
│  │   Execute Task      │                                                 │
│  └──────────┬──────────┘                                                 │
│             │                                                             │
│             ▼                                                             │
│  ┌─────────────────────┐                                                 │
│  │ Update Task Status  │                                                 │
│  │ - completed/failed  │                                                 │
│  │ - executed_at       │                                                 │
│  │ - result            │                                                 │
│  └──────────┬──────────┘                                                 │
│             │                                                             │
│             └────────────────────────────────────────────────────────────┘
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Task Lifecycle

### State Machine

```
                    ┌─────────────┐
                    │             │
                    │  CREATED    │
                    │             │
                    └──────┬──────┘
                           │
                           │ Task Saved to DB
                           ▼
                    ┌─────────────┐
                    │             │
           ┌────────│  SCHEDULED  │────────┐
           │        │             │        │
           │        └──────┬──────┘        │
           │               │               │
           │ Execution     │ Execution     │ Manual
           │ Success       │ Failure       │ Cancellation
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │             │ │             │ │             │
    │  COMPLETED  │ │   FAILED    │ │  CANCELLED  │
    │             │ │             │ │  (future)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Status Definitions

| Status | Description | Transitions From | Transitions To |
|--------|-------------|------------------|----------------|
| `scheduled` | Task is waiting to be executed | (initial) | completed, failed |
| `completed` | Task executed successfully | scheduled | (terminal) |
| `failed` | Task execution failed | scheduled | (terminal) |

---

## Task Execution Logic

### Role Change Algorithm

```python
def execute_task_internal(data):
    # 1. Fetch current user roles from database
    current_roles = user.roles.split(',')
    
    # 2. Calculate new roles based on action
    if action == 'add':
        # Add roles that aren't already present
        new_roles = current_roles + [r for r in roles_to_change if r not in current_roles]
    else:  # remove
        # Remove specified roles
        new_roles = [r for r in current_roles if r not in roles_to_change]
    
    # 3. Execute SSH command
    command = f"sudo tctl users update --set-roles {','.join(new_roles)} {user_name}"
    output, error = execute_ssh_command(portal, command)
    
    # 4. Update database and task status
    user.roles = ','.join(new_roles)
    task.status = 'completed' if not error else 'failed'
    task.executed_at = datetime.now()
    task.result = output or error
```

### Execution Sequence Diagram

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Scheduler│     │  Query   │     │   User   │     │   SSH    │     │ Teleport │
│         │     │  Engine  │     │   Table  │     │  Module  │     │  Server  │
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │               │                │                │                │
     │ Check Due     │                │                │                │
     │──────────────►│                │                │                │
     │               │                │                │                │
     │               │ Query Tasks    │                │                │
     │               │───────────────►│                │                │
     │               │                │                │                │
     │               │ Return Tasks   │                │                │
     │               │◄───────────────│                │                │
     │               │                │                │                │
     │ For Each Task │                │                │                │
     │◄──────────────│                │                │                │
     │               │                │                │                │
     │ Get User      │                │                │                │
     │───────────────────────────────►│                │                │
     │               │                │                │                │
     │ User Data     │                │                │                │
     │◄───────────────────────────────│                │                │
     │               │                │                │                │
     │ Execute SSH   │                │                │                │
     │───────────────────────────────────────────────►│                │
     │               │                │                │                │
     │               │                │                │ tctl update    │
     │               │                │                │───────────────►│
     │               │                │                │                │
     │               │                │                │ Result         │
     │               │                │                │◄───────────────│
     │               │                │                │                │
     │ SSH Result    │                │                │                │
     │◄───────────────────────────────────────────────│                │
     │               │                │                │                │
     │ Update Task   │                │                │                │
     │───────────────────────────────►│                │                │
     │               │                │                │                │
```

---

## Scheduling API

### Create Scheduled Task

**Endpoint:** `POST /teleport/schedule-role-change`

**Request:**
```json
{
  "userId": "john_at_corp.com_kocharsoft",
  "userName": "john@corp.com",
  "portal": "kocharsoft",
  "scheduledTime": "2024-12-31T09:00:00Z",
  "action": "add",
  "roles": ["superadmin", "developer"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role change scheduled for john@corp.com on 2024-12-31T09:00:00Z",
  "task_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Immediate Execution

**Endpoint:** `POST /teleport/execute-role-change-immediate`

Bypasses scheduling and executes immediately, but still creates a task record for audit purposes.

---

## Error Handling

### Error Categories

| Error Type | Handling Strategy | Recovery |
|------------|-------------------|----------|
| SSH Connection Failed | Mark task as failed | Manual retry |
| Command Execution Error | Log error, mark failed | Review logs |
| Database Error | Rollback transaction | Automatic retry on next cycle |
| User Not Found | Mark task as failed | Manual intervention |

### Error Recording

```python
try:
    # Execute task
except Exception as e:
    task.status = 'failed'
    task.executed_at = datetime.now()
    task.result = f"Error: {str(e)}"
    session.commit()
```

---

## Configuration

### Scheduler Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `check_interval` | 60 seconds | How often to check for due tasks |
| Thread Type | Daemon | Automatically stops when main app stops |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `SSH_HOSTS` | JSON mapping of portal names to hostnames |
| `SSH_PORT` | SSH connection port (default: 22) |
| `SSH_USER` | SSH username for connections |
| `SSH_KEY_PATH` | Path to SSH private key file |

---

## Monitoring & Logging

### Log Events

```
[TaskScheduler] INFO  - Task scheduler started
[TaskScheduler] DEBUG - Checking for due tasks at 2024-12-01T10:00:00
[TaskScheduler] INFO  - Found 3 due tasks to execute
[TaskScheduler] INFO  - Executing task abc123 for user john@corp.com
[TaskScheduler] INFO  - Task abc123 executed successfully
[TaskScheduler] ERROR - Task def456 execution failed: SSH connection timeout
```

### Metrics to Track

1. **Tasks Scheduled** - Count of tasks created
2. **Tasks Completed** - Count of successful executions
3. **Tasks Failed** - Count of failed executions
4. **Average Execution Time** - Performance monitoring
5. **Queue Depth** - Number of pending tasks

---

## Future Enhancements

1. **Retry Mechanism**: Automatic retry for failed tasks with exponential backoff
2. **Task Cancellation**: API to cancel pending tasks
3. **Priority Queue**: Urgent tasks executed before regular ones
4. **Notification System**: Email/webhook notifications on completion/failure
5. **Distributed Scheduling**: Support for multiple scheduler instances using Redis
6. **Rate Limiting**: Prevent overwhelming Teleport servers with too many requests

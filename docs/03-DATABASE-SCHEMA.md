# Database Schema Document

## Overview

The Teleport User Management System uses PostgreSQL as its primary database, with SQLAlchemy as the ORM layer. The database consists of two main tables that store user information and scheduled task data.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐                                       │
│  │            users                 │                                       │
│  ├─────────────────────────────────┤                                       │
│  │ PK  id          VARCHAR(50)     │                                       │
│  │     name        VARCHAR(255)    │──────┐                                │
│  │     roles       VARCHAR         │      │                                │
│  │     created_date TIMESTAMP      │      │                                │
│  │     last_login  TIMESTAMP       │      │                                │
│  │     status      VARCHAR(20)     │      │                                │
│  │     manager     VARCHAR(255)    │      │                                │
│  │     portal      VARCHAR(50)     │      │                                │
│  └─────────────────────────────────┘      │                                │
│                                           │ References (logical)           │
│                                           │                                │
│  ┌─────────────────────────────────┐      │                                │
│  │       scheduled_tasks           │      │                                │
│  ├─────────────────────────────────┤      │                                │
│  │ PK  id          VARCHAR(50)     │      │                                │
│  │     user_id     VARCHAR(50)     │◄─────┘                                │
│  │     user_name   VARCHAR(255)    │                                       │
│  │     portal      VARCHAR(50)     │                                       │
│  │     scheduled_time TIMESTAMP    │                                       │
│  │     action      VARCHAR(10)     │                                       │
│  │     roles       VARCHAR         │                                       │
│  │     status      VARCHAR(20)     │                                       │
│  │     created_at  TIMESTAMP       │                                       │
│  │     executed_at TIMESTAMP       │                                       │
│  │     result      VARCHAR         │                                       │
│  └─────────────────────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### Table: `users`

Stores all Teleport users synchronized from the various portals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(50) | PRIMARY KEY | Unique identifier (format: `{name}_{portal}`) |
| `name` | VARCHAR(255) | NOT NULL | User's display name / email |
| `roles` | VARCHAR | NULLABLE | Comma-separated list of assigned roles |
| `created_date` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the user was created |
| `last_login` | TIMESTAMP | NULLABLE | Last login timestamp |
| `status` | VARCHAR(20) | CHECK CONSTRAINT | User status: 'active', 'inactive', 'pending' |
| `manager` | VARCHAR(255) | NULLABLE | Manager who created the user |
| `portal` | VARCHAR(50) | NULLABLE | Source portal (e.g., 'kocharsoft', 'igzy', 'maxicus') |

**Constraints:**
```sql
CHECK (status IN ('active', 'inactive', 'pending'))
```

**ID Generation Logic:**
```python
user_id = f"{name.replace('@', '_at_')}_{portal}"
# Example: "john.doe@example.com" + "kocharsoft" 
#       → "john.doe_at_example.com_kocharsoft"
```

---

### Table: `scheduled_tasks`

Stores scheduled role change operations and their execution history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(50) | PRIMARY KEY | UUID of the scheduled task |
| `user_id` | VARCHAR(50) | NOT NULL | Reference to users.id |
| `user_name` | VARCHAR(255) | NOT NULL | User's name (denormalized for display) |
| `portal` | VARCHAR(50) | NOT NULL | Target portal for the operation |
| `scheduled_time` | TIMESTAMP | NOT NULL | When the task should execute |
| `action` | VARCHAR(10) | NOT NULL | Operation type: 'add' or 'remove' |
| `roles` | VARCHAR | NOT NULL | Comma-separated list of roles to add/remove |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'scheduled' | Task status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the task was created |
| `executed_at` | TIMESTAMP | NULLABLE | When the task was executed |
| `result` | VARCHAR | NULLABLE | Execution output or error message |

**Status Values:**
- `scheduled`: Task is pending execution
- `completed`: Task executed successfully
- `failed`: Task execution failed

---

## Data Dictionary

### User Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `active` | User exists in Teleport portal | Normal active users |
| `inactive` | User removed from portal but retained | Orphaned users kept for records |
| `pending` | Awaiting activation | Reserved for future use |

### Task Action Values

| Action | Description | SSH Command Generated |
|--------|-------------|----------------------|
| `add` | Add roles to user | `sudo tctl users update --set-roles {merged_roles} {username}` |
| `remove` | Remove roles from user | `sudo tctl users update --set-roles {remaining_roles} {username}` |

### Portal Values

| Portal | Description |
|--------|-------------|
| `kocharsoft` | Kocharsoft organization portal |
| `igzy` | IGZY organization portal |
| `maxicus` | Maxicus organization portal |

---

## Indexes and Performance

### Recommended Indexes

```sql
-- Users table indexes
CREATE INDEX idx_users_portal ON users(portal);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_portal_status ON users(portal, status);

-- Scheduled tasks indexes
CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_scheduled_time ON scheduled_tasks(scheduled_time);
CREATE INDEX idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX idx_scheduled_tasks_status_time ON scheduled_tasks(status, scheduled_time);
```

---

## Data Relationships

### Logical Relationships

```
users.id ◄──── scheduled_tasks.user_id (logical reference, not enforced FK)
```

**Note:** While `scheduled_tasks.user_id` references `users.id`, there is no enforced foreign key constraint. This allows scheduled tasks to persist even if users are deleted.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LIFECYCLE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TELEPORT PORTAL                    DATABASE                            │
│  ┌─────────────┐                   ┌─────────────┐                     │
│  │ User Data   │───── SYNC ───────►│   users     │                     │
│  │ (SSH fetch) │                   │   table     │                     │
│  └─────────────┘                   └──────┬──────┘                     │
│                                           │                             │
│                                           │ Role Changes                │
│                                           ▼                             │
│                                    ┌─────────────┐                     │
│                                    │ scheduled   │                     │
│                                    │ _tasks      │                     │
│                                    └──────┬──────┘                     │
│                                           │                             │
│                                           │ Execute                     │
│                                           ▼                             │
│  ┌─────────────┐                   ┌─────────────┐                     │
│  │ Teleport    │◄──── SSH CMD ─────│   Backend   │                     │
│  │ Server      │                   │  Scheduler  │                     │
│  └─────────────┘                   └─────────────┘                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Migration Scripts

### Initial Migration (1_initial_migration.py)

```python
# Creates the users table
def upgrade():
    op.create_table('users',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('roles', sa.String, nullable=True),
        sa.Column('created_date', sa.DateTime, default=func.current_timestamp()),
        sa.Column('last_login', sa.DateTime, nullable=True),
        sa.Column('status', sa.String(20), nullable=True),
        sa.Column('manager', sa.String(255), nullable=True),
        sa.Column('portal', sa.String(50), nullable=True),
        sa.CheckConstraint("status IN ('active', 'inactive', 'pending')")
    )
```

### Scheduled Tasks Migration (2_add_scheduled_tasks.py)

```python
# Creates the scheduled_tasks table
def upgrade():
    op.create_table('scheduled_tasks',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('user_id', sa.String(50), nullable=False),
        sa.Column('user_name', sa.String(255), nullable=False),
        sa.Column('portal', sa.String(50), nullable=False),
        sa.Column('scheduled_time', sa.DateTime, nullable=False),
        sa.Column('action', sa.String(10), nullable=False),
        sa.Column('roles', sa.String, nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='scheduled'),
        sa.Column('created_at', sa.DateTime, default=func.current_timestamp()),
        sa.Column('executed_at', sa.DateTime, nullable=True),
        sa.Column('result', sa.String, nullable=True)
    )
```

---

## Sample Data

### Users Table Sample

| id | name | roles | status | portal | manager |
|----|------|-------|--------|--------|---------|
| john_at_corp.com_kocharsoft | john@corp.com | admin,developer | active | kocharsoft | admin@corp.com |
| jane_at_corp.com_igzy | jane@corp.com | viewer,auditor | active | igzy | manager@corp.com |
| old_at_corp.com_maxicus | old@corp.com | viewer | inactive | maxicus | NULL |

### Scheduled Tasks Sample

| id | user_id | user_name | action | roles | status | scheduled_time |
|----|---------|-----------|--------|-------|--------|----------------|
| uuid-1 | john_at_corp.com_kocharsoft | john@corp.com | add | superadmin | scheduled | 2024-12-31 09:00:00 |
| uuid-2 | jane_at_corp.com_igzy | jane@corp.com | remove | auditor | completed | 2024-12-01 18:00:00 |

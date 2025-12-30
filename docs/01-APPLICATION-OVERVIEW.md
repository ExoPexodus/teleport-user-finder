# Teleport User Management System - Application Overview

## Executive Summary

The Teleport User Management System is a web-based administrative interface designed to centralize and streamline the management of Teleport users across multiple organizational portals. It provides a unified dashboard for administrators to view, search, filter, edit, and manage user access, roles, and permissions within the Teleport identity and access management ecosystem.

---

## Application Goals

### Primary Objectives

1. **Centralized User Management**: Provide a single pane of glass for managing Teleport users across multiple portals (e.g., Kocharsoft, IGZY, Maxicus).

2. **Role-Based Access Control (RBAC)**: Enable administrators to add, remove, and schedule role changes for users with full audit trail capabilities.

3. **Synchronization with Teleport**: Maintain real-time synchronization between the management system and Teleport authentication servers via SSH-based communication.

4. **Orphaned User Detection**: Identify and manage users that exist in the local database but have been removed from the source Teleport portals.

5. **Scheduled Operations**: Allow administrators to schedule role changes for future execution, enabling time-based access management.

6. **Secure Access**: Enforce JWT-based authentication for all API endpoints and UI access with configurable session timeouts.

---

## Key Features

### 1. User Directory
- View all users across multiple Teleport portals
- Card view and table view display modes
- Advanced search and filtering capabilities
- Filter by portal, manager, and role (include/exclude)

### 2. User Synchronization
- Fetch users from Teleport servers via secure SSH connections
- Automatic detection of new, updated, and orphaned users
- UPSERT-based sync to prevent duplicate entries

### 3. Role Management
- View and edit user roles
- Add or remove roles immediately
- Schedule role changes for future dates/times
- Track execution status and results

### 4. Orphaned User Handling
- Detect users removed from Teleport but still in database
- Options: keep (mark inactive), delete, or selectively manage

### 5. Data Export
- Export user lists to CSV format
- Customizable export based on current filters

### 6. Authentication & Session Management
- JWT-based authentication
- 9-hour session timeout with 10-minute warning
- Session extension capability

---

## Application Flow

### User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User → Login Page → Enter Credentials → JWT Token Generated   │
│                          ↓                                      │
│                 Session Created (9hr TTL)                       │
│                          ↓                                      │
│              Redirect to Main Dashboard                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MAIN DASHBOARD FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard → View Users List → Search/Filter Users              │
│      ↓                                                          │
│  Select User → View Details → Edit User / Manage Roles          │
│      ↓                                                          │
│  Save Changes → API Call → Database Update → UI Refresh         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  USER SYNC FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select Portal → Fetch Users (SSH) → Parse Response             │
│        ↓                                                        │
│  Compare with Database → Identify New/Updated/Orphaned          │
│        ↓                                                        │
│  UPSERT New/Updated → Prompt for Orphaned Management            │
│        ↓                                                        │
│  Apply User Decisions → Update Database → Refresh UI            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 ROLE SCHEDULING FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select User → Choose Action (Add/Remove Roles)                 │
│        ↓                                                        │
│  Select Roles → Set Schedule Date/Time                          │
│        ↓                                                        │
│  Create Scheduled Task → Store in Database                      │
│        ↓                                                        │
│  Scheduler Checks Every Minute → Execute When Due               │
│        ↓                                                        │
│  SSH Command to Teleport → Update Database → Log Result         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### Application Administrator
- Full access to all features
- Can sync users from any portal
- Can manage roles for all users
- Can view and manage scheduled jobs
- Can export data

### Note
Currently, the application uses a single admin account for authentication. All authenticated users have full access to all features.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI Framework | Tailwind CSS, shadcn/ui |
| State Management | TanStack Query (React Query) |
| Routing | React Router v6 |
| Backend | Python Flask |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT (JSON Web Tokens), bcrypt |
| SSH Integration | Paramiko |
| Task Scheduling | Custom Background Scheduler |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | Nginx |

---

## Deployment Architecture

The application is containerized using Docker and deployed with Docker Compose, consisting of:

1. **Frontend Container**: Serves the React SPA via Nginx
2. **Backend Container**: Python Flask API server
3. **Database Container**: PostgreSQL database
4. **Nginx Proxy**: Routes requests to appropriate services

All services communicate within a Docker network, with only Nginx exposed to external traffic.

---

## Security Considerations

1. **Authentication Required**: All API endpoints (except `/health` and `/teleport/login`) require valid JWT tokens
2. **Password Hashing**: Admin passwords are hashed using bcrypt
3. **Session Expiry**: Automatic session timeout after 9 hours
4. **SSH Key-Based Auth**: Secure SSH connections to Teleport servers
5. **CORS Configuration**: Enabled for cross-origin requests
6. **Token Validation**: All requests validate token expiry and authenticity

---

## Future Considerations

1. Multi-user support with role-based permissions
2. Audit logging for all user actions
3. Email notifications for scheduled task execution
4. Dashboard analytics and reporting
5. API rate limiting
6. Two-factor authentication

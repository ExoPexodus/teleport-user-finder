# System Architecture Document

## Overview

The Teleport User Management System follows a three-tier architecture pattern with clear separation between presentation, business logic, and data layers. The system is designed for containerized deployment and integrates with external Teleport authentication servers via SSH.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL NETWORK                                │
│                                                                             │
│  ┌─────────────┐                                    ┌──────────────────┐   │
│  │   Browser   │◄──────── HTTPS ────────────────────│  Teleport Portals│   │
│  │   (Client)  │                                    │  (SSH Targets)   │   │
│  └──────┬──────┘                                    └────────▲─────────┘   │
│         │                                                    │             │
└─────────┼────────────────────────────────────────────────────┼─────────────┘
          │                                                    │
          │ HTTP/HTTPS                                         │ SSH (Port 22)
          │                                                    │
┌─────────┼────────────────────────────────────────────────────┼─────────────┐
│         ▼                     DOCKER NETWORK                 │             │
│  ┌─────────────┐                                             │             │
│  │    Nginx    │                                             │             │
│  │   (Proxy)   │                                             │             │
│  └──────┬──────┘                                             │             │
│         │                                                    │             │
│         ├─────────── /teleportui/ ──────────┐               │             │
│         │                                    │               │             │
│         ▼                                    ▼               │             │
│  ┌─────────────┐                     ┌─────────────┐        │             │
│  │  Frontend   │                     │   Backend   │────────┘             │
│  │   (React)   │                     │   (Flask)   │                      │
│  │   :80       │                     │   :5000     │                      │
│  └─────────────┘                     └──────┬──────┘                      │
│                                             │                              │
│                                             │ SQLAlchemy                   │
│                                             ▼                              │
│                                      ┌─────────────┐                      │
│                                      │  PostgreSQL │                      │
│                                      │   :5432     │                      │
│                                      └─────────────┘                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + TypeScript)                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         PRESENTATION LAYER                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │    Pages     │  │  Components  │  │   UI Library │              │  │
│  │  │  - Index     │  │  - UserList  │  │  (shadcn/ui) │              │  │
│  │  │  - Login     │  │  - Sidebar   │  │  - Button    │              │  │
│  │  │  - Scheduler │  │  - Header    │  │  - Dialog    │              │  │
│  │  │  - Jobs      │  │  - UserCard  │  │  - Table     │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          STATE MANAGEMENT                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │  │
│  │  │   AuthContext    │  │   React Query    │  │  Local State    │   │  │
│  │  │  (Session Mgmt)  │  │  (Server State)  │  │  (UI State)     │   │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           API LAYER                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                      src/lib/api.ts                          │   │  │
│  │  │  - fetchUsers()        - login()                             │   │  │
│  │  │  - updateUser()        - fetchUsersFromSSH()                 │   │  │
│  │  │  - deleteUsers()       - scheduleRoleChange()                │   │  │
│  │  │  - fetchScheduledJobs() - executeRoleChange()                │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Python Flask)                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           API LAYER                                  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │  │
│  │  │   user_routes    │  │ teleport_routes  │  │     health      │   │  │
│  │  │  - GET /users    │  │  - /teleport/*   │  │  - GET /health  │   │  │
│  │  │  - PUT /users/:id│  │                  │  │                 │   │  │
│  │  │  - DELETE /users │  │                  │  │                 │   │  │
│  │  └──────────────────┘  └────────┬─────────┘  └─────────────────┘   │  │
│  │                                 │                                   │  │
│  │         ┌───────────────────────┼───────────────────────┐          │  │
│  │         ▼                       ▼                       ▼          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │  teleport_auth  │  │ teleport_users  │  │teleport_scheduler│   │  │
│  │  │  - /login       │  │ - /fetch-users  │  │- /schedule-role  │   │  │
│  │  │  - /gen-hash    │  │ - /manage-orphan│  │- /scheduled-jobs │   │  │
│  │  └─────────────────┘  │ - /tkgen        │  │- /execute-role   │   │  │
│  │                       └─────────────────┘  └─────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         BUSINESS LAYER                               │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │  │
│  │  │    utils/auth    │  │    utils/ssh     │  │    scheduler    │   │  │
│  │  │  - token_required│  │ - execute_ssh    │  │ - TaskScheduler │   │  │
│  │  │  - generate_token│  │   command        │  │ - check due     │   │  │
│  │  └──────────────────┘  └──────────────────┘  │ - execute task  │   │  │
│  │                                              └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           DATA LAYER                                 │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │  │
│  │  │    models/user   │  │ models/scheduled │  │    utils/db     │   │  │
│  │  │   (SQLAlchemy)   │  │     _task        │  │ - get_db_session│   │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  Browser │────►│   Nginx   │────►│ Flask /login │────►│  bcrypt  │
│          │     │           │     │              │     │  verify  │
└──────────┘     └───────────┘     └──────────────┘     └────┬─────┘
                                                              │
     ┌────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Generate    │────►│ Return Token  │────►│ Store in     │
│  JWT Token   │     │ to Client     │     │ localStorage │
└──────────────┘     └───────────────┘     └──────────────┘
```

### User Sync Flow

```
┌──────────┐     ┌───────────┐     ┌─────────────────┐
│ Frontend │────►│   API     │────►│ SSH Connection  │
│ Trigger  │     │ Endpoint  │     │ to Teleport     │
└──────────┘     └───────────┘     └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ Execute Command │
                                   │ tctl users ls   │
                                   └────────┬────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SYNC LOGIC                                │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │ Parse JSON  │──►│ Compare DB  │──►│ UPSERT Users    │   │
│  │ Response    │   │ Records     │   │ (New/Updated)   │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│                  ┌─────────────────┐                       │
│                  │ Identify        │                       │
│                  │ Orphaned Users  │                       │
│                  └─────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ Return Response │
                                   │ + Orphaned List │
                                   └─────────────────┘
```

---

## Network Architecture

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|---------------|---------------|----------|
| Nginx | 80 | 80/443 | HTTP/HTTPS |
| Frontend | 80 | - (internal) | HTTP |
| Backend | 5000 | - (internal) | HTTP |
| PostgreSQL | 5432 | - (internal) | TCP |
| SSH (Teleport) | 22 | - (outbound) | SSH |

### URL Routing

| Path Pattern | Target | Description |
|--------------|--------|-------------|
| `/teleportui/api/*` | Backend:5000 | API endpoints |
| `/teleportui/teleport/*` | Backend:5000 | Teleport operations |
| `/teleportui/*` | Frontend:80 | Static React app |
| `/health` | Backend:5000 | Health check |

---

## Security Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ TRANSPORT LAYER                                                       │ │
│  │  • HTTPS/TLS encryption (nginx)                                       │ │
│  │  • SSH key-based authentication (paramiko)                            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ APPLICATION LAYER                                                     │ │
│  │  • JWT token authentication                                           │ │
│  │  • Token expiration (configurable)                                    │ │
│  │  • bcrypt password hashing                                            │ │
│  │  • @token_required decorator on endpoints                             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ SESSION LAYER                                                         │ │
│  │  • 9-hour session timeout                                             │ │
│  │  • 10-minute expiry warning                                           │ │
│  │  • Session extension capability                                       │ │
│  │  • Automatic logout on expiry                                         │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ NETWORK LAYER                                                         │ │
│  │  • Docker network isolation                                           │ │
│  │  • Internal-only database access                                      │ │
│  │  • CORS configuration                                                 │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Architecture Limitations
- Single instance deployment
- In-memory task scheduler (not distributed)
- Direct SSH connections per request

### Recommended Improvements for Scale
1. **Horizontal Scaling**: Containerize with Kubernetes
2. **Distributed Scheduler**: Use Celery + Redis for task queue
3. **Connection Pooling**: Implement SSH connection pooling
4. **Caching Layer**: Add Redis for API response caching
5. **Load Balancing**: Multiple backend instances behind LB

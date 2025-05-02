
# Teleport User Management

A full-stack application for managing users across multiple Teleport instances.

## Architecture

This application consists of three main components:

1. **Frontend**: React application with Typescript and Tailwind CSS
2. **Backend**: Python Flask API
3. **Database**: PostgreSQL for data storage

## Getting Started

### Using Docker (Recommended)

The easiest way to run this application is using Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

The application will be available at http://localhost

### Development Setup

#### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
flask run
```

#### Database

For development, you can run PostgreSQL using Docker:

```bash
docker run -d --name teleport-postgres -e POSTGRES_DB=teleport -e POSTGRES_USER=teleport -e POSTGRES_PASSWORD=teleport123 -p 5432:5432 -v $(pwd)/backend/init.sql:/docker-entrypoint-initdb.d/init.sql postgres:15
```

## API Endpoints

- `GET /api/users` - Get all users
- `GET /api/users?portal=kocharsoft` - Get users from a specific portal
- `PUT /api/users/:id` - Update a specific user

## Environment Variables

### Frontend
- `NODE_ENV` - Set to 'production' for production builds

### Backend
- `DB_HOST` - PostgreSQL host
- `DB_NAME` - PostgreSQL database name
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DEBUG` - Set to 'True' for development mode

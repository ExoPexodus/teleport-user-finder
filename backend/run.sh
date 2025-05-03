
#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h postgres -U teleport; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"

# Run migrations
cd /app
alembic upgrade head

# Start the application
echo "Starting the application"
gunicorn --bind 0.0.0.0:5000 app:app


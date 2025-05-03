
#!/bin/bash

# Wait for postgres to be ready
echo "Waiting for Postgres to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - running migrations"

# Run migrations
cd /app
alembic upgrade head

# Start the application
echo "Starting the application"
gunicorn --bind 0.0.0.0:5000 app:app

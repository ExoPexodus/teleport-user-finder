
#!/bin/bash

# Run migrations
cd /app
alembic upgrade head

# Start the application
echo "Starting the application"
gunicorn --bind 0.0.0.0:5000 app:app

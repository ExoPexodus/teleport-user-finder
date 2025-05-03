
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Make the run script executable
RUN chmod +x run.sh

EXPOSE 5000

# Set Python path to include current directory
ENV PYTHONPATH=/app

CMD ["./run.sh"]

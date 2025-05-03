
FROM python:3.11-slim

WORKDIR /app

# Install required packages including PostgreSQL client
RUN apt-get update \
    && apt-get install -y bash dos2unix postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Normalize run.sh and make executable
RUN sed -i 's/\r$//' run.sh \
    && chmod +x run.sh

EXPOSE 5000

ENV PYTHONPATH=/app

# Use bash explicitly
CMD ["/bin/bash", "./run.sh"]



FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Make the run script executable and ensure it has Unix line endings
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix run.sh && \
    chmod +x run.sh && \
    apt-get remove -y dos2unix && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5000

# Set Python path to include current directory
ENV PYTHONPATH=/app

CMD ["./run.sh"]

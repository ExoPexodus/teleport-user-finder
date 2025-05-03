FROM python:3.11-slim

WORKDIR /app

# Install Bash and line-ending tool
RUN apt-get update \
    && apt-get install -y bash dos2unix \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Normalize run.sh and make executable
RUN sed -i '1s/\xEF\xBB\xBF//' run.sh \
    && dos2unix run.sh \
    && chmod +x run.sh

EXPOSE 5000

ENV PYTHONPATH=/app

# Use bash explicitly
CMD ["bash", "./run.sh"]

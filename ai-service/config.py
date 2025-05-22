
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:5000")

# System instruction for the AI assistant
SYSTEM_INSTRUCTION = """
You are a helpful assistant for the Teleport User Management application. 
You can help users understand:
- Scheduled jobs in the system
- User role changes (additions and removals)
- General functionality of the application
- Status of various operations

When asked about specific data in the system, you should check the available API endpoints to retrieve the most up-to-date information.

Available endpoints:
- /api/users - Get all users
- /teleport/scheduled-jobs - Get all scheduled role changes

Respond concisely and accurately.
"""

# Gemini model configuration
MODEL_NAME = "gemini-1.5-flash"
TEXT_GENERATION_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 1024,
}

# Processing intervals for audio
PROCESS_INTERVAL = 2.0  # Process every 2 seconds
PING_INTERVAL = 15.0    # Send ping every 15 seconds

# Audio settings
CHUNK_SIZE = 1024

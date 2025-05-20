
from fastapi import FastAPI, WebSocket, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
import asyncio
import requests
import base64
import io
from pydub import AudioSegment
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, set this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:5000")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set, using demo mode with limited functionality")

genai.configure(api_key=GEMINI_API_KEY)

# Create the base model with generation config
system_instruction = """
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

# Create the model with the correct parameter format
model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config={"temperature": 0.7},
)

# Get application data to inform the AI
async def get_application_data():
    """Fetch all relevant application data to provide context to the AI"""
    try:
        data = {}
        
        # Fetch users
        users_response = requests.get(f"{BACKEND_URL}/api/users")
        if users_response.status_code == 200:
            data["users"] = users_response.json()
            
        # Fetch scheduled jobs
        jobs_response = requests.get(f"{BACKEND_URL}/teleport/scheduled-jobs")
        if jobs_response.status_code == 200:
            data["scheduled_jobs"] = jobs_response.json()
            
        return data
    except Exception as e:
        logger.error(f"Error fetching application data: {e}")
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "AI Integration Service is running"}

@app.post("/api/chat")
async def chat(message: str = Form(...)):
    """Handle text-based chat with the AI"""
    try:
        # Get app data for context
        app_data = await get_application_data()
        
        # Create a prompt that includes the application data and system instruction
        context_prompt = f"""
        {system_instruction}
        
        Here is the current state of the application:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        
        User question: {message}
        """
        
        # Generate a response from Gemini
        response = model.generate_content(context_prompt)
        
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return {"error": str(e)}

@app.post("/api/audio")
async def process_audio(audio: UploadFile = File(...)):
    """Process audio and respond with AI-generated text"""
    try:
        # Read and convert the audio file
        audio_data = await audio.read()
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
        
        # Convert to WAV format for processing
        wav_io = io.BytesIO()
        audio_segment.export(wav_io, format="wav")
        wav_io.seek(0)
        
        # Get application data for context
        app_data = await get_application_data()
        
        # For a real implementation, you would:
        # 1. Convert audio to text using a speech-to-text service
        # 2. Process the text with Gemini
        # 3. Return the response
        
        # Placeholder for speech-to-text (in a real implementation)
        # transcribed_text = speech_to_text(wav_io)
        transcribed_text = "Placeholder for transcribed text"  # Placeholder
        
        # Create context for the AI
        context_prompt = f"""
        {system_instruction}
        
        Here is the current state of the application:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        
        User question (from voice): {transcribed_text}
        """
        
        # Generate response
        response = model.generate_content(context_prompt)
        
        return {"transcription": transcribed_text, "response": response.text}
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return {"error": str(e)}

@app.websocket("/ws/audio-stream")
async def audio_websocket(websocket: WebSocket):
    """Handle streaming audio for real-time voice processing"""
    await websocket.accept()
    
    try:
        # Get application data for context
        app_data = await get_application_data()
        app_context = f"""
        {system_instruction}
        
        Application context:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        """
        
        # In a real implementation, you would continuously:
        # 1. Receive audio chunks
        # 2. Process audio to text when appropriate
        # 3. Get AI responses
        # 4. Send responses back
        
        while True:
            # Receive audio chunk
            audio_chunk = await websocket.receive_bytes()
            
            # Process audio chunk (placeholder)
            # In a real implementation, you would accumulate chunks until
            # you detect a pause or end of speech, then process it
            
            # Placeholder response
            await websocket.send_json({
                "type": "response",
                "content": "This is a placeholder response. In a real implementation, this would process your voice input."
            })
            
            # Check if client is still connected
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

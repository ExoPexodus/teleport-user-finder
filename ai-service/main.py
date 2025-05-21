
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

# System instruction for the AI assistant
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

# Create the model with Gemini 2.0
model = genai.GenerativeModel(
    model_name="gemini-2.0-pro",  # Using Gemini 2.0 Pro model
    generation_config={
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 40,
    },
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
        
        # Generate a response from Gemini 2.0
        response = model.generate_content(context_prompt)
        
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return {"error": str(e)}

@app.post("/api/audio")
async def process_audio(audio: UploadFile = File(...)):
    """Process audio and respond with AI-generated text"""
    try:
        # Read the audio file
        audio_data = await audio.read()
        
        # Convert to base64 for the Gemini API
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        
        # Get application data for context
        app_data = await get_application_data()
        app_context = f"""
        {system_instruction}
        
        Application context:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        """
        
        # Process audio with Gemini 2.0 speech-to-text capability
        speech_model = genai.GenerativeModel("gemini-2.0-pro-vision")
        speech_response = speech_model.generate_content([
            app_context,
            {"audio": audio_b64}
        ])
        
        # Extract the transcribed text
        transcribed_text = speech_response.text
        
        # Generate a response to the transcribed text
        response = model.generate_content([
            app_context,
            f"User question (from voice): {transcribed_text}"
        ])
        
        return {"transcription": transcribed_text, "response": response.text}
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return {"error": str(e)}

@app.websocket("/ws/audio-stream")
async def audio_websocket(websocket: WebSocket):
    """Handle streaming audio for real-time voice processing"""
    await websocket.accept()
    
    # Buffer to accumulate audio chunks
    audio_buffer = io.BytesIO()
    last_process_time = 0
    PROCESS_INTERVAL = 2.0  # Process every 2 seconds
    
    try:
        # Get application data for context
        app_data = await get_application_data()
        app_context = f"""
        {system_instruction}
        
        Application context:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        """
        
        while True:
            # Receive audio chunk
            audio_chunk = await websocket.receive_bytes()
            
            # Add chunk to buffer
            audio_buffer.write(audio_chunk)
            
            # Check if we should process the accumulated audio
            current_time = asyncio.get_event_loop().time()
            if current_time - last_process_time >= PROCESS_INTERVAL and audio_buffer.tell() > 0:
                try:
                    # Reset buffer position and get data
                    audio_buffer.seek(0)
                    audio_data = audio_buffer.getvalue()
                    
                    # Convert to base64 for the Gemini API
                    audio_b64 = base64.b64encode(audio_data).decode("utf-8")
                    
                    # Process audio with Gemini 2.0 speech-to-text
                    speech_model = genai.GenerativeModel("gemini-2.0-pro-vision")
                    speech_response = speech_model.generate_content([
                        app_context,
                        {"audio": audio_b64}
                    ])
                    
                    # Extract the transcribed text
                    transcribed_text = speech_response.text
                    
                    if transcribed_text and transcribed_text.strip():
                        # Generate a response to the transcribed text
                        response = model.generate_content([
                            app_context,
                            f"User question (from voice): {transcribed_text}"
                        ])
                        
                        # Send transcription and response back to client
                        await websocket.send_json({
                            "type": "transcription",
                            "content": transcribed_text
                        })
                        
                        await websocket.send_json({
                            "type": "response",
                            "content": response.text
                        })
                    
                    # Reset buffer and update processing time
                    audio_buffer = io.BytesIO()
                    last_process_time = current_time
                    
                except Exception as e:
                    logger.error(f"Error processing audio stream: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Error processing audio: {str(e)}"
                    })
            
            # Small delay to prevent CPU overuse
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

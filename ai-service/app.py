
from fastapi import FastAPI, WebSocket, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import local modules
from config import logger
from data_service import get_application_data
from gemini_service import process_text_request, process_audio_request
from audio_handler import handle_audio_stream

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

@app.get("/")
async def root():
    return {"message": "AI Integration Service is running"}

@app.post("/api/chat")
async def chat(message: str = Form(...)):
    """Handle text-based chat with the AI"""
    try:
        # Get app data for context
        app_data = await get_application_data()
        
        # Process the request and get response
        return await process_text_request(message, app_data)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return {"error": str(e)}

@app.post("/api/audio")
async def process_audio(audio: UploadFile = File(...)):
    """Process audio and respond with AI-generated text"""
    try:
        # Read the audio file
        audio_data = await audio.read()
        
        # Get application data for context
        app_data = await get_application_data()
        
        # Process audio and get response
        return await process_audio_request(audio_data, app_data)
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return {"error": str(e)}

@app.websocket("/ws/audio-stream")
async def audio_websocket(websocket: WebSocket):
    """Handle streaming audio for real-time voice processing"""
    # Get application data for context
    app_data = await get_application_data()
    
    # Handle the audio stream
    await handle_audio_stream(websocket, app_data)

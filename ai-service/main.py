
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
        
        # Create a client for the Gemini API
        client = genai.Client()
        
        # Use the correct model for text generation
        model = client.get_generative_model(model_name="gemini-2.0-flash-live-001")
        
        # Configure response to be text only for regular chat
        generation_config = {
            "response_modalities": ["TEXT"],
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
        }
        
        # Generate a response using the correct API approach
        response = model.generate_content(
            contents=context_prompt,
            generation_config=generation_config
        )
        
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
        
        # Create a client for the Gemini API
        client = genai.Client()
        
        # Use the correct model for audio processing with Live API approach
        speech_model = client.get_generative_model(
            model_name="gemini-2.0-flash-live-001",
            generation_config={
                "response_modalities": ["TEXT"],
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
            }
        )
        
        # Create the content parts - text context and audio
        contents = [
            {"text": app_context},
            {"inline_data": {"mime_type": "audio/mp3", "data": audio_b64}}
        ]
        
        # Generate response
        response = speech_model.generate_content(contents)
        
        # Extract the transcribed text - in this implementation we just get the full response
        transcribed_text = response.text
        
        # Now generate a proper response to the transcribed text
        chat_response = speech_model.generate_content([
            {"text": app_context},
            {"text": f"User question (from voice): {transcribed_text}"}
        ])
        
        return {"transcription": transcribed_text, "response": chat_response.text}
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return {"error": str(e)}

@app.websocket("/ws/audio-stream")
async def audio_websocket(websocket: WebSocket):
    """Handle streaming audio for real-time voice processing"""
    await websocket.accept()
    logger.info("connection open")
    
    # Buffer to accumulate audio chunks
    audio_buffer = io.BytesIO()
    last_process_time = 0
    last_ping_time = 0
    PROCESS_INTERVAL = 2.0  # Process every 2 seconds
    PING_INTERVAL = 15.0    # Send ping every 15 seconds
    
    try:
        # Get application data for context
        app_data = await get_application_data()
        app_context = f"""
        {system_instruction}
        
        Application context:
        Users: {json.dumps(app_data.get('users', []))}
        Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
        """
        
        # Create a client for the Gemini API
        client = genai.Client()
        
        # Send initial connection confirmation message
        await websocket.send_json({
            "type": "status",
            "content": "Connected to audio stream"
        })
        
        while True:
            try:
                # Check if we need to send a ping to keep connection alive
                current_time = asyncio.get_event_loop().time()
                if current_time - last_ping_time >= PING_INTERVAL:
                    await websocket.send_json({
                        "type": "status",
                        "content": "ping"
                    })
                    last_ping_time = current_time
                
                # Receive audio chunk with a timeout
                audio_chunk = await asyncio.wait_for(websocket.receive_bytes(), timeout=5.0)
                
                # Add chunk to buffer
                audio_buffer.write(audio_chunk)
                
                # Check if we should process the accumulated audio
                if current_time - last_process_time >= PROCESS_INTERVAL and audio_buffer.tell() > 0:
                    try:
                        # Reset buffer position and get data
                        audio_buffer.seek(0)
                        audio_data = audio_buffer.getvalue()
                        
                        # Only process if we have enough data (at least 1KB)
                        if len(audio_data) > 1024:
                            # Convert to base64 for the Gemini API
                            audio_b64 = base64.b64encode(audio_data).decode("utf-8")
                            
                            # Process audio with Flash model
                            speech_model = client.get_generative_model(
                                model_name="gemini-2.0-flash-live-001",
                                generation_config={
                                    "response_modalities": ["TEXT"],
                                    "temperature": 0.7,
                                    "top_p": 0.95,
                                    "top_k": 40,
                                }
                            )
                            
                            # Create content with context and audio
                            contents = [
                                {"text": app_context},
                                {"inline_data": {"mime_type": "audio/webm", "data": audio_b64}}
                            ]
                            
                            # Generate response
                            speech_response = speech_model.generate_content(contents)
                            
                            # Extract the transcribed text
                            transcribed_text = speech_response.text
                            
                            if transcribed_text and transcribed_text.strip():
                                # Generate a response to the transcribed text
                                chat_response = speech_model.generate_content([
                                    {"text": app_context},
                                    {"text": f"User question (from voice): {transcribed_text}"}
                                ])
                                
                                # Send transcription and response back to client
                                await websocket.send_json({
                                    "type": "transcription",
                                    "content": transcribed_text
                                })
                                
                                await websocket.send_json({
                                    "type": "response",
                                    "content": chat_response.text
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
                
            except asyncio.TimeoutError:
                # Ping to keep connection alive
                current_time = asyncio.get_event_loop().time()
                if current_time - last_ping_time >= PING_INTERVAL:
                    await websocket.send_json({
                        "type": "status",
                        "content": "ping"
                    })
                    last_ping_time = current_time
                continue
            except Exception as e:
                logger.error(f"Error in WebSocket communication: {e}")
                # Try to send an error message if possible
                try:
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Communication error: {str(e)}"
                    })
                except:
                    pass
                break
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up
        logger.info("connection closed")
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

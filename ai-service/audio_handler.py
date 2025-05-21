
import asyncio
import json
import logging
from fastapi import WebSocket
import base64
import io
import tempfile
from config import logger
from gemini_service import get_gemini_model, create_context_prompt

async def handle_audio_stream(websocket: WebSocket, app_data):
    """Handle streaming audio for real-time voice processing"""
    try:
        # Accept the WebSocket connection
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        
        # Send a connection confirmation message
        await websocket.send_json({
            "type": "status",
            "content": "Connected to audio service"
        })
        
        # Set up the Gemini model
        model = get_gemini_model()
        app_context = create_context_prompt(app_data)
        
        # Create a temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.webm') as temp_file:
            # We'll collect audio chunks here
            chunks = []
            
            # Send a ping every 10 seconds to keep the connection alive
            ping_task = asyncio.create_task(send_periodic_ping(websocket))
            
            try:
                # While we're receiving data
                while True:
                    # Receive binary data
                    audio_chunk = await websocket.receive_bytes()
                    chunks.append(audio_chunk)
                    
                    # If we've received a complete message (end of speech or enough data)
                    # Process what we have so far
                    if len(chunks) > 5:  # Process after a few chunks to simulate real-time
                        # Save chunks to the temporary file
                        temp_file.seek(0)
                        for chunk in chunks:
                            temp_file.write(chunk)
                        temp_file.flush()
                        
                        # Convert audio to base64 for Gemini
                        temp_file.seek(0)
                        audio_data = temp_file.read()
                        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
                        
                        # Create content parts for multimodal input
                        contents = [
                            {"text": app_context},
                            {"inline_data": {"mime_type": "audio/webm", "data": audio_b64}}
                        ]
                        
                        try:
                            # Generate response for audio transcription
                            logger.info("Generating transcription with Gemini")
                            response = model.generate_content(contents)
                            transcribed_text = response.text
                            
                            # Send the transcription back to the client
                            await websocket.send_json({
                                "type": "transcription",
                                "content": transcribed_text
                            })
                            
                            # Generate response to the transcribed text
                            logger.info(f"Generating response to transcription: {transcribed_text[:30]}...")
                            chat_response = model.generate_content([
                                {"text": app_context},
                                {"text": f"User question (from voice): {transcribed_text}"}
                            ])
                            
                            # Send the response back to the client
                            await websocket.send_json({
                                "type": "response",
                                "content": chat_response.text
                            })
                            
                            # Clear chunks to start a new collection
                            chunks = []
                            
                        except Exception as e:
                            logger.error(f"Error processing audio: {e}")
                            await websocket.send_json({
                                "type": "error",
                                "content": f"Error processing audio: {str(e)}"
                            })
                            chunks = []  # Reset chunks on error
                    
            except asyncio.CancelledError:
                logger.info("WebSocket connection cancelled")
                ping_task.cancel()
                
            except Exception as e:
                logger.error(f"Error in WebSocket handler: {e}")
                ping_task.cancel()
                try:
                    await websocket.send_json({
                        "type": "error",
                        "content": f"Connection error: {str(e)}"
                    })
                except:
                    pass
                    
    except Exception as e:
        logger.error(f"WebSocket connection failed: {e}")
        
    finally:
        logger.info("WebSocket connection closed")

async def send_periodic_ping(websocket: WebSocket):
    """Send periodic pings to keep the WebSocket connection alive"""
    try:
        while True:
            await asyncio.sleep(10)
            await websocket.send_json({
                "type": "status",
                "content": "ping"
            })
    except Exception as e:
        logger.error(f"Error sending ping: {e}")

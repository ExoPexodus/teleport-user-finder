
import base64
import io
import logging
import asyncio
from pydub import AudioSegment

from config import PROCESS_INTERVAL, PING_INTERVAL
import gemini_service

logger = logging.getLogger(__name__)

async def handle_audio_stream(websocket, app_data):
    """Handle streaming audio for real-time voice processing"""
    await websocket.accept()
    logger.info("connection open")
    
    # Buffer to accumulate audio chunks
    audio_buffer = io.BytesIO()
    last_process_time = 0
    last_ping_time = 0
    
    try:
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
                            
                            # Get client for speech processing
                            client = gemini_service.get_gemini_client()
                            
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
                            app_context = gemini_service.create_context_prompt(app_data)
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

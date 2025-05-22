import asyncio
import json
import logging
from fastapi import WebSocket
import base64
import tempfile

from config import logger
from gemini_service import (
    get_gemini_model,
    create_context_prompt,
    stream_response,
    synthesize_speech,
)

async def handle_audio_stream(websocket: WebSocket, app_data):
    """Handle streaming audio for real-time voice processing"""
    await websocket.accept()
    logger.info("WebSocket connection accepted")

    # Initial status
    await websocket.send_json({"type": "status", "content": "Connected to audio service"})

    model = get_gemini_model()
    app_context = create_context_prompt(app_data)

    with tempfile.NamedTemporaryFile(suffix=".webm") as temp_file:
        chunks = []
        ping_task = asyncio.create_task(send_periodic_ping(websocket))

        try:
            while True:
                audio_chunk = await websocket.receive_bytes()
                chunks.append(audio_chunk)

                if len(chunks) > 5:
                    # Write collected chunks to disk
                    temp_file.seek(0)
                    temp_file.truncate(0)
                    for chunk in chunks:
                        temp_file.write(chunk)
                    temp_file.flush()

                    # Read and b64-encode for Gemini
                    temp_file.seek(0)
                    audio_data = temp_file.read()
                    audio_b64 = base64.b64encode(audio_data).decode("utf-8")

                    # 1️⃣ Transcription (batch)
                    contents = [
                        {"text": app_context},
                        {"inline_data": {"mime_type": "audio/webm", "data": audio_b64}},
                    ]
                    try:
                        logger.info("Generating transcription with Gemini")
                        resp = model.generate_content(contents=contents)
                        transcribed_text = resp.text
                        await websocket.send_json({"type": "transcription", "content": transcribed_text})

                        # 2️⃣ Streamed chat response
                        chat_contents = [
                            {"text": app_context},
                            {"text": f"User question (from voice): {transcribed_text}"},
                        ]
                        logger.info("Streaming chat response")
                        await stream_response(chat_contents, websocket)

                        # 3️⃣ Final full response for TTS
                        final_resp = model.generate_content(contents=chat_contents).text
                        tts_bytes = await synthesize_speech(final_resp)
                        tts_b64 = base64.b64encode(tts_bytes).decode("utf-8")
                        await websocket.send_json({"type": "tts", "content": tts_b64})

                    except Exception as e:
                        logger.error(f"Error processing audio: {e}")
                        await websocket.send_json({"type": "error", "content": str(e)})
                    finally:
                        chunks = []

        except asyncio.CancelledError:
            logger.info("WebSocket connection cancelled")
            ping_task.cancel()

        except Exception as e:
            logger.error(f"Error in WebSocket handler: {e}")
            ping_task.cancel()
            try:
                await websocket.send_json({"type": "error", "content": str(e)})
            except:
                pass

        finally:
            logger.info("WebSocket connection closed")


async def send_periodic_ping(websocket: WebSocket):
    """Send periodic pings to keep the WebSocket connection alive"""
    try:
        while True:
            await asyncio.sleep(10)
            await websocket.send_json({"type": "status", "content": "ping"})
    except Exception as e:
        logger.error(f"Error sending ping: {e}")

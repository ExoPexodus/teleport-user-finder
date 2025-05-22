
import google.generativeai as genai
import json
import base64
import logging
from config import GEMINI_API_KEY, MODEL_NAME, SYSTEM_INSTRUCTION, TEXT_GENERATION_CONFIG
from google.cloud import texttospeech

logger = logging.getLogger(__name__)

# Configure Gemini API
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set, using demo mode with limited functionality")
genai.configure(api_key=GEMINI_API_KEY)

def create_context_prompt(app_data, user_message=None):
    """Create a prompt with system instruction and application data"""
    prompt = f"""
    {SYSTEM_INSTRUCTION}
    
    Here is the current state of the application:
    Users: {json.dumps(app_data.get('users', []))}
    Scheduled Jobs: {json.dumps(app_data.get('scheduled_jobs', []))}
    """
    
    if user_message:
        prompt += f"\nUser question: {user_message}"
        
    return prompt

def get_gemini_model():
    """Get the Gemini model for text generation with proper configuration"""
    logger.info(f"Creating Gemini model with name: {MODEL_NAME}")
    return genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=TEXT_GENERATION_CONFIG
    )

async def stream_response(contents, websocket):
    """Low-latency streaming to WS"""
    model = get_gemini_model()
    stream = model.generate_content(contents=contents, stream=True)
    async for chunk in stream:
        if chunk.text:
            await websocket.send_json({"type": "stream", "content": chunk.text})


async def process_text_request(message, app_data):
    """Process a text request and return the AI response"""
    try:
        logger.info("Processing text request")
        # Create context prompt
        context_prompt = create_context_prompt(app_data, message)
        
        # Get model
        model = get_gemini_model()
        
        # Generate response
        logger.info("Generating content with Gemini")
        response = model.generate_content(contents=context_prompt)
        
        logger.info("Successfully generated response")
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error processing text request: {e}")
        return {"error": str(e), "response": "Sorry, there was an error processing your request."}

async def synthesize_speech(text: str) -> bytes:
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    resp = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    return resp.audio_content

async def process_audio_request(audio_data, app_data):
    """Process an audio request and return the AI response"""
    try:
        logger.info("Processing audio request")
        # Convert audio data to base64
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        
        # Create context
        app_context = create_context_prompt(app_data)
        
        # Get model
        model = get_gemini_model()
        
        # Create content parts for multimodal input
        contents = [
            {"text": app_context},
            {"inline_data": {"mime_type": "audio/mp3", "data": audio_b64}}
        ]
        
        # Generate response for audio transcription
        logger.info("Generating transcription with Gemini")
        response = model.generate_content(contents)
        transcribed_text = response.text
        
        # Generate response to the transcribed text
        logger.info(f"Generating response to transcription: {transcribed_text[:30]}...")
        chat_response = model.generate_content([
            {"text": app_context},
            {"text": f"User question (from voice): {transcribed_text}"}
        ])
        
        return {"transcription": transcribed_text, "response": chat_response.text}
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return {"error": str(e), "transcription": "", "response": "Sorry, there was an error processing your audio."}

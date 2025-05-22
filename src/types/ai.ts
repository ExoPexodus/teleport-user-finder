
export interface AITextResponse {
  response: string;
}

export interface AIAudioResponse {
  transcription: string;
  response: string;
}

export interface AIWebSocketMessage {
  type: 'response' | 'error' | 'status' | 'transcription' | 'stream' | 'tts';
  content: string;
}

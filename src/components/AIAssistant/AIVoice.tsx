
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";
import { AIWebSocketMessage } from "@/types/ai";
import { AudioVisualizer } from "./AudioVisualizer";
import { sendAudioMessage } from "@/lib/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIVoiceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AIVoice = ({ messages, setMessages, isLoading, setIsLoading }: AIVoiceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // WebSocket reference for audio streaming
  const webSocketRef = useRef<WebSocket | null>(null);
  
  // MediaRecorder reference for voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Timeout references
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Clean up WebSocket and MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
    };
  }, [isRecording]);

  // Handle starting/stopping voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      setIsRecording(false);
      setConnectionStatus('disconnected');
      
      // Clear any pending timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
    } else {
      try {
        // Set connecting status
        setConnectionStatus('connecting');
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup WebSocket connection through Nginx proxy
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/audio-stream`;
        const ws = new WebSocket(wsUrl);
        webSocketRef.current = ws;
        
        // Add connection timeout - 5 seconds to establish connection
        connectionTimeoutRef.current = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            toast({
              title: 'Connection Timeout',
              description: 'Failed to establish WebSocket connection within timeout period',
              variant: 'destructive',
            });
            setIsRecording(false);
            setConnectionStatus('disconnected');
          }
          connectionTimeoutRef.current = null;
        }, 5000);
        
        // Setup ping timeout - if no ping received within 30 seconds, close connection
        const resetPingTimeout = () => {
          if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
          }
          pingTimeoutRef.current = setTimeout(() => {
            if (webSocketRef.current) {
              webSocketRef.current.close();
              toast({
                title: 'Connection Lost',
                description: 'Lost connection to the voice service',
                variant: 'destructive',
              });
              setIsRecording(false);
              setConnectionStatus('disconnected');
            }
            pingTimeoutRef.current = null;
          }, 30000);
        };
        
        // Start ping timeout when connection opens
        resetPingTimeout();
        
        // Setup WebSocket event handlers
        ws.onopen = () => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          
          setConnectionStatus('connected');
          
          // Create MediaRecorder once WebSocket is open
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm' // Use a widely supported format
          });
          mediaRecorderRef.current = mediaRecorder;
          
          // Add user message to indicate recording started
          setMessages(prev => [...prev, { role: 'user', content: '🎤 Recording...' }]);
          
          // Send audio data when available
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };
          
          // Handle MediaRecorder stop
          mediaRecorder.onstop = () => {
            // Update the last user message to show recording stopped
            setMessages(prev => {
              const newMessages = [...prev];
              // Find the last recording message
              let lastRecordingIndex = -1;
              for (let i = newMessages.length - 1; i >= 0; i--) {
                if (newMessages[i].role === 'user' && newMessages[i].content === '🎤 Recording...') {
                  lastRecordingIndex = i;
                  break;
                }
              }
              
              if (lastRecordingIndex !== -1) {
                newMessages[lastRecordingIndex].content = '🎤 Voice message sent';
              }
              return newMessages;
            });
            
            // Stop all audio tracks
            stream.getTracks().forEach(track => track.stop());
          };
          
          // Start recording with shorter chunks for more responsive interaction
          mediaRecorder.start(500); // Collect 500ms chunks
          setIsRecording(true);
        };
        
        // Handle messages from the server
        ws.onmessage = (event) => {
          try {
            // Reset ping timeout on any message
            resetPingTimeout();
            
            const data = JSON.parse(event.data) as AIWebSocketMessage;
            
            // Handle status message (ping/connection confirmation)
            if (data.type === 'status') {
              console.log('WebSocket status:', data.content);
              return;
            }
            
            // Handle transcription message
            if (data.type === 'transcription') {
              setMessages(prev => [...prev, { role: 'user', content: `Transcription: ${data.content}` }]);
              setIsAiSpeaking(false);
            }
            
            // Handle response message
            if (data.type === 'response') {
              setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
              setIsAiSpeaking(true);
              
              // Add a delay and then turn off the visualizer
              setTimeout(() => {
                setIsAiSpeaking(false);
              }, 5000);
            }
            
            // Handle error message
            if (data.type === 'error') {
              toast({
                title: 'Error',
                description: data.content,
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        // Handle WebSocket errors
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to voice service',
            variant: 'destructive',
          });
          setIsRecording(false);
          setConnectionStatus('disconnected');
          
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
            pingTimeoutRef.current = null;
          }
        };
        
        // Handle WebSocket close
        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          setConnectionStatus('disconnected');
          
          if (isRecording) {
            toast({
              title: 'Connection Closed',
              description: 'Voice connection was closed',
              variant: 'default',
            });
            setIsRecording(false);
          }
          
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
            pingTimeoutRef.current = null;
          }
        };
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: 'Microphone Error',
          description: 'Failed to access microphone. Please check permissions.',
          variant: 'destructive',
        });
        setIsRecording(false);
        setConnectionStatus('disconnected');
      }
    }
  };
  
  // Handle file upload for audio (alternative to streaming)
  const handleAudioUpload = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: '🎤 Uploaded voice message' }]);
      
      // Send to API using the api.ts function
      const data = await sendAudioMessage(file);
      
      // Add transcription and response to chat
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: `Transcription: ${data.transcription}` },
        { role: 'assistant', content: data.response }
      ]);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to process voice message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome message when no messages exist
  const renderWelcomeMessage = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
          <div className="bg-teleport-blue/10 rounded-full p-4">
            <Mic className="h-8 w-8 text-teleport-blue" />
          </div>
          <h3 className="font-medium text-lg">Teleport AI Voice Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Use your voice to interact with the AI assistant. Click the microphone button to start recording.
          </p>
        </div>
      );
    }
    return null;
  };

  // Get connection status indicator color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-400';
    }
  };

  return (
    <>
      {/* Voice Messages */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 min-h-[calc(100vh-280px)]">
          {renderWelcomeMessage()}
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-teleport-blue text-white' 
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Voice Controls */}
      <div className="flex flex-col items-center space-y-4 p-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        
        {/* Audio visualizer */}
        <div className="w-full flex justify-center mb-2">
          <AudioVisualizer 
            isActive={isAiSpeaking} 
            color="#3b82f6"
          />
        </div>
        
        <Button
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "default"}
          className={`w-16 h-16 rounded-full ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-teleport-blue hover:bg-teleport-darkblue'
          }`}
          disabled={isLoading || connectionStatus === 'connecting'}
        >
          {isRecording ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {isRecording ? "Tap to stop recording" : "Tap to start recording"}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Speech is processed in real-time with Gemini
        </p>
      </div>
    </>
  );
};

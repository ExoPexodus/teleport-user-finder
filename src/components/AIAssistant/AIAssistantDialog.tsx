import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, MessageCircle, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
export const AIAssistantDialog = ({
  open,
  onOpenChange
}: AIAssistantDialogProps) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();

  // WebSocket reference for audio streaming
  const webSocketRef = useRef<WebSocket | null>(null);

  // MediaRecorder reference for voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
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
    };
  }, [isRecording]);

  // Handle sending text messages
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    try {
      setIsLoading(true);

      // Add user message to chat
      const userMessage = {
        role: 'user' as const,
        content: inputValue
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');

      // Send message to API
      const formData = new FormData();
      formData.append('message', inputValue);
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI assistant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    } else {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });

        // Setup WebSocket connection
        webSocketRef.current = new WebSocket('ws://localhost:8000/ws/audio-stream');
        webSocketRef.current.onopen = () => {
          // Create MediaRecorder once WebSocket is open
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          // Add user message to indicate recording started
          setMessages(prev => [...prev, {
            role: 'user',
            content: '🎤 Recording...'
          }]);

          // Send audio data when available
          mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0 && webSocketRef.current?.readyState === WebSocket.OPEN) {
              webSocketRef.current.send(event.data);
            }
          };

          // Handle MediaRecorder stop
          mediaRecorder.onstop = () => {
            // Update the last user message to show recording stopped
            setMessages(prev => {
              const newMessages = [...prev];
              // Find the last recording message using a for loop instead of findLastIndex
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

          // Start recording
          mediaRecorder.start(100); // Collect 100ms chunks
          setIsRecording(true);
        };

        // Handle messages from the server
        webSocketRef.current.onmessage = event => {
          const data = JSON.parse(event.data);
          if (data.type === 'response') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data.content
            }]);
          }
        };

        // Handle WebSocket errors
        webSocketRef.current.onerror = error => {
          console.error('WebSocket error:', error);
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to voice service',
            variant: 'destructive'
          });
          setIsRecording(false);
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: 'Microphone Error',
          description: 'Failed to access microphone. Please check permissions.',
          variant: 'destructive'
        });
      }
    }
  };

  // Handle file upload for audio (alternative to streaming)
  const handleAudioUpload = async (file: File) => {
    try {
      setIsLoading(true);

      // Add user message to chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: '🎤 Uploaded voice message'
      }]);

      // Create form data
      const formData = new FormData();
      formData.append('audio', file);

      // Send to API
      const response = await fetch('/api/ai/audio', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to process audio');
      }
      const data = await response.json();

      // Add transcription and response to chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Transcription: ${data.transcription}`
      }, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to process voice message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current && activeTab === 'chat') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, activeTab]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2 mx-0 px-0 py-0">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span>Voice</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-[300px] p-4 rounded border">
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {message.content}
                    </div>
                  </div>)}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Chat Input */}
            <div className="flex items-center space-x-2">
              <Input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type your message here..." onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }} disabled={isLoading} />
              <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-4">
            {/* Voice Messages */}
            <ScrollArea className="h-[300px] p-4 rounded border">
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {message.content}
                    </div>
                  </div>)}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Voice Controls */}
            <div className="flex flex-col items-center space-y-4">
              <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"} className="w-16 h-16 rounded-full" disabled={isLoading}>
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Tap to stop recording" : "Tap to start recording"}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <div className="text-sm text-muted-foreground">
            AI assistant will answer questions about your Teleport application.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
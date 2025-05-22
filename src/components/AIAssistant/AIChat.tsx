
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Paperclip } from "lucide-react";
import { sendChatMessage } from "@/lib/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AIChat = ({ messages, setMessages, isLoading, setIsLoading }: AIChatProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when component mounts or becomes visible
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Handle sending text messages
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage = { role: 'user' as const, content: inputValue };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // Send message to API using the api.ts function
      const data = await sendChatMessage(inputValue);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input for audio uploads
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      // This will be handled by parent component
      toast({
        title: 'Audio upload',
        description: 'Audio upload functionality is currently disabled.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload an audio file.',
        variant: 'destructive',
      });
    }
  };

  // Welcome message when no messages exist
  const renderWelcomeMessage = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
          <div className="bg-teleport-blue/10 rounded-full p-4">
            <MessageCircle className="h-8 w-8 text-teleport-blue" />
          </div>
          <h3 className="font-medium text-lg">Teleport AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Ask me questions about your Teleport application, user management, 
            or how to use specific features.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 pr-4">
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
      
      {/* Chat Input Area */}
      <div className="flex items-center space-x-2 pt-2 border-t">
        <input
          type="file"
          accept="audio/*"
          id="audio-upload"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => document.getElementById('audio-upload')?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!inputValue.trim() || isLoading}
          size="icon"
          variant="default"
          className="rounded-full bg-teleport-blue hover:bg-teleport-darkblue"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

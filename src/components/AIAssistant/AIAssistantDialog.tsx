
import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Mic, MessageCircle } from "lucide-react";
import { AIChat } from './AIChat';
import { AIVoice } from './AIVoice';

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantDialog = ({ open, onOpenChange }: AIAssistantDialogProps) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[450px] p-0 flex flex-col h-full overflow-hidden border-l shadow-lg" side="right">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Fixed tab alignment */}
            <div className="border-b">
              <TabsList className="w-full grid grid-cols-2 rounded-none bg-transparent h-12">
                <TabsTrigger 
                  value="chat" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teleport-blue h-12 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="voice" 
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teleport-blue h-12 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span>Voice</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chat" className="flex-1 flex flex-col px-6 py-4 space-y-4 mt-0 border-none">
              <AIChat 
                messages={messages} 
                setMessages={setMessages} 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabsContent>
            
            <TabsContent value="voice" className="flex-1 flex flex-col px-6 py-4 space-y-4 mt-0 border-none">
              <AIVoice
                messages={messages}
                setMessages={setMessages}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <SheetFooter className="border-t px-6 py-4">
          <div className="text-xs text-muted-foreground w-full text-center">
            AI assistant powered by Gemini
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

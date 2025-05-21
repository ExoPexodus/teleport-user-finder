
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { AIAssistantDialog } from './AIAssistantDialog';

export const AIAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-teleport-blue hover:bg-teleport-darkblue flex items-center justify-center"
        aria-label="AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      
      <AIAssistantDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

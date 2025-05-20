
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
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg bg-indigo-600 hover:bg-indigo-700"
        aria-label="AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      
      <AIAssistantDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <Shield className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h3>
        <p className="text-red-600 mb-6">{message}</p>
        <Button onClick={handleRetry} className="bg-teleport-blue hover:bg-teleport-darkblue">
          Try Again
        </Button>
      </div>
    </div>
  );
};

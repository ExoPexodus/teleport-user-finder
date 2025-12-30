
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionWarningDialogProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  remainingSeconds: number;
}

export const SessionWarningDialog = ({
  isOpen,
  onStayLoggedIn,
  onLogout,
  remainingSeconds,
}: SessionWarningDialogProps) => {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    setCountdown(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isOpen) return;

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-teleport-gray border-teleport-blue">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-yellow-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Your session will expire in{' '}
            <span className="font-bold text-yellow-500">{formatTime(countdown)}</span>.
            Would you like to stay logged in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onLogout}
            className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
          >
            Logout
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onStayLoggedIn}
            className="bg-teleport-blue hover:bg-teleport-blue/80"
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

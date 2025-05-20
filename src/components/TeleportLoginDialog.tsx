
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { teleportLogin } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/Loader';

interface TeleportLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeleportLoginDialog: React.FC<TeleportLoginDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await teleportLogin(username, password);
      toast({
        title: "Success",
        description: "Teleport authentication successful"
      });
      onSuccess();
    } catch (error) {
      console.error('Teleport login error:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate with Teleport",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Teleport Authentication</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your Teleport credentials to access portal data.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-teleport-blue hover:bg-teleport-blue/80"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : "Login"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginDialog = ({ isOpen, onClose, onSuccess }: LoginDialogProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(username, password);
      // Check if there are any roles in the response
      const decodedToken = response.decoded_token || {};
      const roles = decodedToken.realm_access?.roles || [];
      
      // Show appropriate message based on roles
      if (roles.includes('admin')) {
        toast({
          title: "Login successful",
          description: "You're now authenticated with full admin access."
        });
      } else if (roles.includes('limited_user')) {
        toast({
          title: "Login successful",
          description: "You're now authenticated with limited access."
        });
      } else {
        toast({
          title: "Login successful",
          description: "You're now authenticated."
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Authentication failed. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-teleport-gray border-teleport-blue">
        <DialogHeader>
          <DialogTitle className="text-white">Authentication Required</DialogTitle>
          <DialogDescription className="text-gray-300">
            Please login to access SSH features
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-slate-800 text-white border-slate-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-slate-800 text-white border-slate-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleLogin}
            className="bg-teleport-blue hover:bg-teleport-blue/80 flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

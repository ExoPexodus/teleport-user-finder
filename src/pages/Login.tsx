
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login as apiLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const data = await apiLogin(username, password);
      login(data.token);
      toast({
        title: "Login successful",
        description: "Welcome to Teleport User Manager."
      });
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
    <div className="min-h-screen bg-teleport-darkgray flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-teleport-gray border-teleport-blue">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-teleport-blue/20">
              <Shield className="h-8 w-8 text-teleport-blue" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Teleport User Manager</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-slate-800 text-white border-slate-700 focus:border-teleport-blue"
                autoComplete="username"
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
                className="bg-slate-800 text-white border-slate-700 focus:border-teleport-blue"
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-teleport-blue hover:bg-teleport-blue/80 flex items-center justify-center gap-2"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

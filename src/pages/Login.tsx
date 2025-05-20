
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSSO, setIsSSO] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to home page
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    try {
      await login(username, password);
      // Navigation is handled in the auth context
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    setIsSSO(true);
    try {
      // Redirect to Keycloak SSO login page
      window.location.href = '/auth/sso-login';
    } catch (error) {
      console.error('SSO login failed:', error);
      setIsSSO(false);
    }
  };

  return (
    <div className="min-h-screen bg-teleport-darkgray flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-teleport-gray border-teleport-blue">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-teleport-blue p-3 rounded-full">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Teleport Admin</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800 text-white border-slate-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 text-white border-slate-700"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-teleport-blue hover:bg-teleport-blue/80 flex items-center gap-2"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </>
              )}
            </Button>
            
            <div className="flex items-center w-full">
              <Separator className="flex-grow bg-slate-700" />
              <span className="px-3 text-slate-400 text-sm">OR</span>
              <Separator className="flex-grow bg-slate-700" />
            </div>
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full border-slate-700 text-white hover:bg-teleport-blue/20"
              onClick={handleSSOLogin}
              disabled={isSSO}
            >
              {isSSO ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Redirecting to SSO...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Login with SSO</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

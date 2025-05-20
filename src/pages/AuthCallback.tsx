
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/Loader';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleSSOCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the authorization code from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in the callback URL');
        }
        
        // Exchange the code for tokens
        await handleSSOCallback(code);
        
        // Success, redirect to home page
        navigate('/');
        toast({
          title: 'SSO Login Successful',
          description: 'You have been successfully authenticated via SSO.',
        });
      } catch (error) {
        console.error('SSO callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        toast({
          title: 'SSO Login Failed',
          description: error instanceof Error ? error.message : 'Authentication failed',
          variant: 'destructive',
        });
        navigate('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [location.search, navigate, toast, handleSSOCallback]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-teleport-darkgray flex flex-col items-center justify-center">
        <Loader size="lg" />
        <p className="mt-4 text-white">Processing SSO login...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-teleport-darkgray flex flex-col items-center justify-center text-white">
        <div className="bg-red-500/20 border border-red-500 rounded-md p-4 max-w-md">
          <h1 className="text-xl font-bold mb-2">Authentication Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return <Loader size="lg" />;
};

export default AuthCallback;

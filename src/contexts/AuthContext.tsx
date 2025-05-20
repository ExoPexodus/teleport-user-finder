
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { login, fetchUserProfile, exchangeSSO } from '@/lib/api';
import { AdminUser } from '@/types/admin';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
  handleSSOCallback: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await fetchUserProfile();
        setUser(userProfile);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await login(username, password);
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
      setIsAuthenticated(true);
      navigate('/');
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userProfile.name || username}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Authentication failed.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOCallback = async (code: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Exchange the authorization code for tokens
      await exchangeSSO(code);
      
      // Fetch the user profile
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
      setIsAuthenticated(true);
      
      // Return void instead of userProfile to match the interface
    } catch (error) {
      console.error('SSO callback error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user_roles');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_roles');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
  };

  const refreshUserProfile = async () => {
    try {
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Profile refresh error:', error);
      if (error instanceof Error && error.message.includes('Authentication expired')) {
        handleLogout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
        refreshUserProfile,
        isLoading,
        handleSSOCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

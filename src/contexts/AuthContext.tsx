
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
        // Only remove token if it's an authentication error
        if (error instanceof Error && 
           (error.message.includes('Authentication') || 
            error.message.includes('token') ||
            error.message.includes('401') ||
            error.message.includes('403'))) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
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
    // Get token to check if it's an SSO login
    const token = localStorage.getItem('token');
    
    // Clear local storage regardless
    localStorage.removeItem('token');
    localStorage.removeItem('user_roles');
    setUser(null);
    setIsAuthenticated(false);
    
    // Check if we should redirect to Keycloak logout
    const isKeycloakLogin = token && token.length > 200; // Simple heuristic for Keycloak token
    
    if (isKeycloakLogin) {
      // Redirect to Keycloak logout endpoint
      const keycloakURL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080/auth';
      const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'teleport';
      const frontendURL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      
      const logoutURL = `${keycloakURL}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(frontendURL + '/login')}`;
      
      window.location.href = logoutURL;
    } else {
      // Regular logout - just navigate to login
      navigate('/login');
    }
    
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

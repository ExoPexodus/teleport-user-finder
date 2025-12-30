
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const SESSION_TIMEOUT_MS = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionCreatedAt');
    setIsAuthenticated(false);
  }, []);

  const checkSessionExpiry = useCallback(() => {
    const sessionCreatedAt = localStorage.getItem('sessionCreatedAt');
    if (!sessionCreatedAt) return false;

    const createdTime = parseInt(sessionCreatedAt, 10);
    const now = Date.now();
    const elapsed = now - createdTime;

    if (elapsed >= SESSION_TIMEOUT_MS) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please login again.",
        variant: "destructive"
      });
      logout();
      return true;
    }
    return false;
  }, [logout, toast]);

  useEffect(() => {
    // Check if token exists and session is not expired
    const token = localStorage.getItem('token');
    if (token) {
      const expired = checkSessionExpiry();
      setIsAuthenticated(!expired);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);

    // Set up interval to check session expiry every minute
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        checkSessionExpiry();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, [checkSessionExpiry]);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('sessionCreatedAt', Date.now().toString());
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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

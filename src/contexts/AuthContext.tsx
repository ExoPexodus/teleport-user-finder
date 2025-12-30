
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SessionWarningDialog } from '@/components/SessionWarningDialog';

const SESSION_TIMEOUT_MS = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
const WARNING_BEFORE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes before expiry

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
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const { toast } = useToast();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionCreatedAt');
    setIsAuthenticated(false);
    setShowWarning(false);
  }, []);

  const extendSession = useCallback(() => {
    localStorage.setItem('sessionCreatedAt', Date.now().toString());
    setShowWarning(false);
    toast({
      title: "Session Extended",
      description: "Your session has been extended for another 9 hours.",
    });
  }, [toast]);

  const checkSessionExpiry = useCallback(() => {
    const sessionCreatedAt = localStorage.getItem('sessionCreatedAt');
    if (!sessionCreatedAt) return { expired: false, shouldWarn: false, remaining: 0 };

    const createdTime = parseInt(sessionCreatedAt, 10);
    const now = Date.now();
    const elapsed = now - createdTime;
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    if (elapsed >= SESSION_TIMEOUT_MS) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please login again.",
        variant: "destructive"
      });
      logout();
      return { expired: true, shouldWarn: false, remaining: 0 };
    }

    // Check if we should show warning (within 10 minutes of expiry)
    if (remaining <= WARNING_BEFORE_EXPIRY_MS && remaining > 0) {
      return { expired: false, shouldWarn: true, remaining: Math.floor(remaining / 1000) };
    }

    return { expired: false, shouldWarn: false, remaining: Math.floor(remaining / 1000) };
  }, [logout, toast]);

  useEffect(() => {
    // Check if token exists and session is not expired
    const token = localStorage.getItem('token');
    if (token) {
      const { expired, shouldWarn, remaining } = checkSessionExpiry();
      setIsAuthenticated(!expired);
      if (shouldWarn) {
        setRemainingSeconds(remaining);
        setShowWarning(true);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);

    // Set up interval to check session expiry every 30 seconds
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        const { expired, shouldWarn, remaining } = checkSessionExpiry();
        if (!expired && shouldWarn && !showWarning) {
          setRemainingSeconds(remaining);
          setShowWarning(true);
        }
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [checkSessionExpiry, showWarning]);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('sessionCreatedAt', Date.now().toString());
    setIsAuthenticated(true);
    setShowWarning(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
      <SessionWarningDialog
        isOpen={showWarning}
        onStayLoggedIn={extendSession}
        onLogout={logout}
        remainingSeconds={remainingSeconds}
      />
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

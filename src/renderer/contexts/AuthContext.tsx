import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      if (!window.electronAPI?.auth) {
        setIsLoading(false);
        return;
      }

      const userData = await window.electronAPI.auth.getCurrentUser();
      if (userData) {
        setUser(userData);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setUser(null);
        localStorage.removeItem('isAuthenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    if (!window.electronAPI?.auth) {
      throw new Error('Authentication API not available');
    }

    try {
      const userData = await window.electronAPI.auth.login(username, password);
      if (userData) {
        setUser(userData);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error: any) {
      // Extract clean error message
      const errorMessage = error.message || 'Invalid username or password';
      const cleanMessage = errorMessage.replace(/^Error:\s*/i, '').replace(/Error invoking remote method.*?:\s*/i, '').trim();
      throw new Error(cleanMessage || 'Invalid username or password');
    }
  };

  const logout = async () => {
    try {
      if (window.electronAPI?.auth) {
        await window.electronAPI.auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('isAuthenticated');
    }
  };

  useEffect(() => {
    // Check if user is authenticated on mount
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === 'true') {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


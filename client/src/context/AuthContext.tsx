import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<any>;
  register: (formData: any) => Promise<any>;
  demoLogin: (username: string) => Promise<any>;
  logout: () => void;
  updateUserProfile: (profileData: Partial<User>) => Promise<User | undefined>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexushub_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem('nexushub_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to load authenticated user:', err);
      localStorage.removeItem('nexushub_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (emailOrUsername: string, password: string) => {
    const res = await authAPI.login({ emailOrUsername, password });
    if (res.data.success) {
      localStorage.setItem('nexushub_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const register = async (formData: any) => {
    const res = await authAPI.register(formData);
    if (res.data.success) {
      localStorage.setItem('nexushub_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const demoLogin = async (username: string) => {
    const res = await authAPI.demoLogin(username);
    if (res.data.success) {
      localStorage.setItem('nexushub_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('nexushub_token');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    const res = await authAPI.updateProfile(profileData);
    if (res.data.success) {
      setUser((prev) => (prev ? { ...prev, ...res.data.user } : res.data.user));
      return res.data.user;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
        updateUserProfile,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

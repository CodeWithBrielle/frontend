"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextValue, AuthResponse } from '@/types/auth';
import { saveToken, removeToken, hasToken } from '@/lib/auth';
import { fetchApi } from '@/lib/api';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!hasToken()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchApi<AuthResponse>('/api/auth/me');
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetchApi<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      if (response.success && response.token) {
        saveToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid login response');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

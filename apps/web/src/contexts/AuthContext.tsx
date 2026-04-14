'use client';

import React, { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  avatar?: string | null;
  favoritePlayers?: string[];
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithOAuth: (provider: string) => Promise<any>;
  signup: (data: { email: string; password: string; name?: string }) => Promise<any>;
  logout: () => void;
  updateUser: (id: string, data: Partial<AuthUser>) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  confirmPasswordReset: (token: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  const login = async (email, password) => {
    return signIn('credentials', { email, password, redirect: false });
  };

  const loginWithOAuth = (provider) => {
    return signIn(provider, { redirect: false });
  };

  const signup = async ({ email, password, name }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return signIn('credentials', { email, password, redirect: false });
  };

  const logout = () => signOut({ callbackUrl: '/' });

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  };

  const requestPasswordReset = async (email) => {
    const res = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  };

  const confirmPasswordReset = async (token, password) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) throw new Error('Reset failed');
    return res.json();
  };

  const value: AuthContextType = {
    currentUser: session?.user as AuthUser ?? null,
    isAuthenticated: !!session,
    isAdmin: (session?.user as AuthUser)?.role === 'admin',
    loading: status === 'loading',
    login,
    loginWithOAuth,
    signup,
    logout,
    updateUser,
    requestPasswordReset,
    confirmPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: true,
      login: async () => { throw new Error('useAuth not ready'); },
      loginWithOAuth: async () => { throw new Error('useAuth not ready'); },
      signup: async () => { throw new Error('useAuth not ready'); },
      logout: () => {},
      updateUser: async () => { throw new Error('useAuth not ready'); },
      requestPasswordReset: async () => { throw new Error('useAuth not ready'); },
      confirmPasswordReset: async () => { throw new Error('useAuth not ready'); },
    };
  }
  return context;
};

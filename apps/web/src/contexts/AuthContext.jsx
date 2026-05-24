
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext();

const decodeAuthTokenId = (token) => {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decodedPayload = JSON.parse(window.atob(normalizedPayload));
    return decodedPayload.id || decodedPayload.recordId || decodedPayload.sub || null;
  } catch (error) {
    console.warn('[AuthContext] Failed to decode auth token:', error);
    return null;
  }
};

const normalizeAuthUser = (model) => {
  if (!model && !pb.authStore.isValid) return null;

  const tokenUserId = decodeAuthTokenId(pb.authStore.token);
  if (!model) {
    return tokenUserId ? { id: tokenUserId } : null;
  }

  return {
    ...model,
    id: model.id || tokenUserId,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(normalizeAuthUser(pb.authStore.model));
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUser(normalizeAuthUser(pb.authStore.model));
    setIsAuthenticated(pb.authStore.isValid);
    setLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log('[AuthContext] Auth store changed. Valid:', pb.authStore.isValid, 'Has Token:', !!token);
      setCurrentUser(normalizeAuthUser(model));
      setIsAuthenticated(pb.authStore.isValid);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    console.log('Login attempt with email:', email);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      // Explicitly set state here as well as relying on the listener, for immediate updates
      setCurrentUser(normalizeAuthUser(authData.record));
      setIsAuthenticated(true);
      
      return authData;
    } catch (error) {
      console.error('Auth error details:', { 
        status: error.status, 
        message: error.message, 
        response: error.response 
      });
      throw error;
    }
  };

  const loginWithOAuth = (provider) => {
    console.log(`[OAuth] Initiating login flow for provider: ${provider}`);
    
    return pb.collection('users').authWithOAuth2({ provider })
      .then((authData) => {
        console.log(`[OAuth] Callback successful for ${provider}.`);
        console.log(`[OAuth] Token stored in authStore:`, !!pb.authStore.token);
        console.log(`[OAuth] Auth data received for user ID:`, authData?.record?.id);
        setCurrentUser(normalizeAuthUser(authData.record));
        setIsAuthenticated(true);
        return authData;
      })
      .catch((err) => {
        console.error(`[OAuth] Error during ${provider} flow:`, err);
        console.error(`[OAuth] Error details:`, JSON.stringify(err, null, 2));
        throw err;
      });
  };

  const signup = async (email, password, name, country = '') => {
    console.log('Signup attempt with email:', email);
    
    const payload = {
      email,
      password,
      passwordConfirm: password,
      name,
      country,
      favorite_players: [],
      role: 'user' // Default role
    };
    
    console.log('Signup payload before create:', payload);
    
    try {
      await pb.collection('users').create(payload, { $autoCancel: false });
      return await login(email, password);
    } catch (error) {
      console.error('Signup error details:', { 
        status: error.status, 
        message: error.message, 
        response: error.response 
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logging out, clearing auth store');
    pb.authStore.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (id, data) => {
    const updatedUser = await pb.collection('users').update(id, data, { $autoCancel: false });
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  const requestPasswordReset = async (email) => {
    return await pb.collection('users').requestPasswordReset(email, { $autoCancel: false });
  };

  const confirmPasswordReset = async (token, password, passwordConfirm) => {
    return await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm, { $autoCancel: false });
  };

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin: currentUser?.role === 'admin',
    loading,
    login,
    loginWithOAuth,
    signup,
    logout,
    updateUser,
    requestPasswordReset,
    confirmPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

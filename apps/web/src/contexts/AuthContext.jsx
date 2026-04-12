
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUser(pb.authStore.model);
    setIsAuthenticated(pb.authStore.isValid);
    setLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log('[AuthContext] Auth store changed. Valid:', pb.authStore.isValid, 'Has Token:', !!token);
      setCurrentUser(model);
      setIsAuthenticated(pb.authStore.isValid);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    return authData;
  };

  const loginWithOAuth = (provider) => {
    console.log(`[OAuth] Initiating login flow for provider: ${provider}`);
    
    // Returns a promise, do not await here to avoid Safari popup blocking
    // PocketBase SDK automatically handles the popup and redirect URI internally
    return pb.collection('users').authWithOAuth2({ provider })
      .then((authData) => {
        console.log(`[OAuth] Callback successful for ${provider}.`);
        console.log(`[OAuth] Token stored in authStore:`, !!pb.authStore.token);
        console.log(`[OAuth] Auth data received for user ID:`, authData?.record?.id);
        return authData;
      })
      .catch((err) => {
        console.error(`[OAuth] Error during ${provider} flow:`, err);
        console.error(`[OAuth] Error details:`, JSON.stringify(err, null, 2));
        throw err;
      });
  };

  const signup = async (data) => {
    await pb.collection('users').create({
      ...data,
      favorite_players: [],
      role: 'user' // Default role
    }, { $autoCancel: false });
    
    return await login(data.email, data.password);
  };

  const logout = () => {
    console.log('[AuthContext] Logging out, clearing auth store');
    pb.authStore.clear();
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

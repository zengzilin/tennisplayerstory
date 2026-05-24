// @ts-nocheck
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useLanguage } from '@/contexts/LanguageContext.tsx';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();
  const { currentLanguage } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${currentLanguage}/login`} state={{ from: location }} replace />;
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to={`/${currentLanguage}`} replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
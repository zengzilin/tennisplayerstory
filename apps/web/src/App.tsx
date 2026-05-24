// @ts-nocheck

import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useParams, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext.tsx';
import { AuthProvider } from '@/contexts/AuthContext.tsx';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext.tsx';
import ProtectedRoute from '@/components/ProtectedRoute.tsx';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute.tsx';
import ScrollToTop from '@/components/ScrollToTop.tsx';
import GoogleAnalytics from '@/components/GoogleAnalytics.tsx';
import GoogleSearchConsole from '@/components/GoogleSearchConsole.tsx';
import SkipNavigation from '@/components/SkipNavigation.tsx';

import HomePage from '@/pages/HomePage.tsx';
import LiveMatchesPage from '@/pages/LiveMatchesPage.tsx';
import PlayersPage from '@/pages/PlayersPage.tsx';
import RankingsPage from '@/pages/RankingsPage.tsx';
import StoriesPage from '@/pages/StoriesPage.tsx';
import VlogsPage from '@/pages/VlogsPage.tsx';
import VlogDetailPage from '@/pages/VlogDetailPage.tsx';
import LoginPage from '@/pages/LoginPage.tsx';
import SignupPage from '@/pages/SignupPage.tsx';
import UserProfilePage from '@/pages/UserProfilePage.tsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage.tsx';
import WriteArticlePage from '@/pages/WriteArticlePage.tsx';
import MyArticlesPage from '@/pages/MyArticlesPage.tsx';
import AdminDashboard from '@/pages/AdminDashboard.tsx';
import AdminScrapingDashboard from '@/pages/AdminScrapingDashboard.tsx';
import PlayerManagementPage from '@/pages/PlayerManagementPage.tsx';
import AdminArticlesPage from '@/pages/AdminArticlesPage.tsx';
import AdminVlogsPage from '@/pages/AdminVlogsPage.tsx';
import ContentManagerPage from '@/pages/ContentManagerPage.tsx';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.tsx';
import TermsOfServicePage from '@/pages/TermsOfServicePage.tsx';
import SitemapPage from '@/pages/SitemapPage.tsx';
import SitemapXml from '@/pages/SitemapXml.tsx';

const LanguageWrapper = () => {
  const { lang } = useParams();
  const { currentLanguage, changeLanguage } = useLanguage();
  
  const isValidLang = ['en', 'zh', 'ja', 'es', 'fr', 'de'].includes(lang);

  useEffect(() => {
    if (isValidLang && lang !== currentLanguage) {
      changeLanguage(lang, false);
    }
  }, [lang, isValidLang, currentLanguage, changeLanguage]);

  if (!isValidLang) {
    return <Navigate to={`/${currentLanguage}`} replace />;
  }

  return <Outlet />;
};

const RootRedirect = () => {
  const { currentLanguage } = useLanguage();
  return <Navigate to={`/${currentLanguage}`} replace />;
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <LanguageProvider>
            <AuthProvider>
              <ScrollToTop />
              <SkipNavigation />
              <GoogleAnalytics />
              <GoogleSearchConsole />
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/sitemap.xml" element={<SitemapXml />} />
                
                <Route path="/:lang" element={<LanguageWrapper />}>
                  {/* Public Routes */}
                  <Route index element={<HomePage />} />
                  <Route path="live-matches" element={<LiveMatchesPage />} />
                  <Route path="players" element={<PlayersPage />} />
                  <Route path="rankings" element={<RankingsPage />} />
                  <Route path="stories" element={<StoriesPage />} />
                  <Route path="vlogs" element={<VlogsPage />} />
                  <Route path="vlog/:id" element={<VlogDetailPage />} />
                  
                  <Route path="login" element={<LoginPage />} />
                  <Route path="signup" element={<SignupPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="reset-password/:token" element={<ResetPasswordPage />} />
                  
                  <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="sitemap" element={<SitemapPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                  <Route path="write-article" element={<ProtectedRoute><WriteArticlePage /></ProtectedRoute>} />
                  <Route path="my-articles" element={<ProtectedRoute><MyArticlesPage /></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                  <Route path="admin/scraping" element={<ProtectedAdminRoute><AdminScrapingDashboard /></ProtectedAdminRoute>} />
                  <Route path="admin/players" element={<ProtectedAdminRoute><PlayerManagementPage /></ProtectedAdminRoute>} />
                  <Route path="admin/articles" element={<ProtectedAdminRoute><AdminArticlesPage /></ProtectedAdminRoute>} />
                  <Route path="admin/vlogs" element={<ProtectedAdminRoute><AdminVlogsPage /></ProtectedAdminRoute>} />
                  <Route path="admin/content-manager" element={<ProtectedAdminRoute><ContentManagerPage /></ProtectedAdminRoute>} />
                </Route>
                
                <Route path="*" element={<RootRedirect />} />
              </Routes>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </LanguageProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;

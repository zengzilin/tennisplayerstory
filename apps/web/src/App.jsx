
import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useParams, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import GoogleAnalytics from '@/components/GoogleAnalytics.jsx';
import GoogleSearchConsole from '@/components/GoogleSearchConsole.jsx';
import SkipNavigation from '@/components/SkipNavigation.jsx';

import HomePage from '@/pages/HomePage.jsx';
import LiveMatchesPage from '@/pages/LiveMatchesPage.jsx';
import PlayersPage from '@/pages/PlayersPage.jsx';
import RankingsPage from '@/pages/RankingsPage.jsx';
import StoriesPage from '@/pages/StoriesPage.jsx';
import VlogsPage from '@/pages/VlogsPage.jsx';
import VlogDetailPage from '@/pages/VlogDetailPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import UserProfilePage from '@/pages/UserProfilePage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage.jsx';
import WriteArticlePage from '@/pages/WriteArticlePage.jsx';
import MyArticlesPage from '@/pages/MyArticlesPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import AdminScrapingDashboard from '@/pages/AdminScrapingDashboard.jsx';
import PlayerManagementPage from '@/pages/PlayerManagementPage.jsx';
import AdminArticlesPage from '@/pages/AdminArticlesPage.jsx';
import AdminVlogsPage from '@/pages/AdminVlogsPage.jsx';
import ContentManagerPage from '@/pages/ContentManagerPage.jsx';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.jsx';
import TermsOfServicePage from '@/pages/TermsOfServicePage.jsx';
import SitemapPage from '@/pages/SitemapPage.jsx';
import SitemapXml from '@/pages/SitemapXml.jsx';

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

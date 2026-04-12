/*
 * LANGUAGE SWITCHING TEST CHECKLIST
 *
 * 1. Supported Routes:
 *    - Public: /:lang/, /:lang/live-matches, /:lang/players, /:lang/rankings, /:lang/stories, /:lang/login, /:lang/signup, /:lang/forgot-password, /:lang/reset-password/:token, /:lang/privacy-policy, /:lang/terms-of-service
 *    - Protected (User): /:lang/profile, /:lang/my-articles, /:lang/write-article
 *    - Protected (Admin): /:lang/admin, /:lang/admin/scraping, /:lang/admin/players, /:lang/admin/articles
 *    - Root: / redirects to /en
 *
 * 2. Expected Behavior on Switch:
 *    - Clicking EN/ZH/JA/ES/FR toggle in Header preserves current path (e.g., /en/players -> /fr/joueurs).
 *    - UI text translates immediately without full page reload.
 *
 * 3. Protected Routes (Logged Out):
 *    - Accessing /en/profile redirects to /en/login.
 *    - Accessing /fr/admin redirects to /fr/login.
 *
 * 4. LocalStorage:
 *    - 'language' key is updated to 'en', 'zh', 'ja', 'es', or 'fr'.
 *    - Opening a new tab syncs the language state.
 *
 * 5. URL Behavior:
 *    - Invalid language prefix (e.g., /de/players) redirects to /en (or current stored language).
 *    - Navigating directly to a valid language URL updates the app context to match the URL.
 */

import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate, useParams, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import GoogleAnalytics from '@/components/GoogleAnalytics.jsx';
import GoogleSearchConsole from '@/components/GoogleSearchConsole.jsx';

import HomePage from '@/pages/HomePage.jsx';
import LiveMatchesPage from '@/pages/LiveMatchesPage.jsx';
import PlayersPage from '@/pages/PlayersPage.jsx';
import PlayerDetailPage from '@/pages/PlayerDetailPage.jsx';
import RankingsPage from '@/pages/RankingsPage.jsx';
import StoriesPage from '@/pages/StoriesPage.jsx';
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
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage.jsx';
import TermsOfServicePage from '@/pages/TermsOfServicePage.jsx';
import SitemapPage from '@/pages/SitemapPage.jsx';

const LanguageWrapper = () => {
  const { lang } = useParams();
  const { currentLanguage, changeLanguage } = useLanguage();

  const isValidLang = ['en', 'zh', 'ja', 'es', 'fr'].includes(lang);

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
      <Router>
        <LanguageProvider>
          <AuthProvider>
            <ScrollToTop />
            <GoogleAnalytics />
            <GoogleSearchConsole />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/sitemap.xml" element={<SitemapPage />} />

              <Route path="/:lang" element={<LanguageWrapper />}>
                <Route index element={<HomePage />} />
                <Route path="live-matches" element={<LiveMatchesPage />} />

                <Route path="players" element={<PlayersPage />} />
                <Route path="players/:playerId" element={<PlayerDetailPage />} />
                <Route path="球员" element={<PlayersPage />} />
                <Route path="球员/:playerId" element={<PlayerDetailPage />} />
                <Route path="プレイヤー" element={<PlayersPage />} />
                <Route path="プレイヤー/:playerId" element={<PlayerDetailPage />} />
                <Route path="jugadores" element={<PlayersPage />} />
                <Route path="jugadores/:playerId" element={<PlayerDetailPage />} />
                <Route path="joueurs" element={<PlayersPage />} />
                <Route path="joueurs/:playerId" element={<PlayerDetailPage />} />

                <Route path="rankings" element={<RankingsPage />} />
                <Route path="排名" element={<RankingsPage />} />
                <Route path="ランキング" element={<RankingsPage />} />
                <Route path="clasificaciones" element={<RankingsPage />} />
                <Route path="classements" element={<RankingsPage />} />

                <Route path="stories" element={<StoriesPage />} />
                <Route path="故事" element={<StoriesPage />} />
                <Route path="ストーリー" element={<StoriesPage />} />
                <Route path="historias" element={<StoriesPage />} />
                <Route path="histoires" element={<StoriesPage />} />

                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-of-service" element={<TermsOfServicePage />} />

                <Route path="profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                <Route path="write-article" element={<ProtectedRoute><WriteArticlePage /></ProtectedRoute>} />
                <Route path="my-articles" element={<ProtectedRoute><MyArticlesPage /></ProtectedRoute>} />

                <Route path="admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path="admin/scraping" element={<ProtectedAdminRoute><AdminScrapingDashboard /></ProtectedAdminRoute>} />
                <Route path="admin/players" element={<ProtectedAdminRoute><PlayerManagementPage /></ProtectedAdminRoute>} />
                <Route path="admin/articles" element={<ProtectedAdminRoute><AdminArticlesPage /></ProtectedAdminRoute>} />
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;

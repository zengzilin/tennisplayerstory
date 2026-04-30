
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('common.error', 'Please fill in all fields'));
      return;
    }

    console.log('Login payload:', { email, password });
    setIsSubmitting(true);
    
    try {
      const authData = await login(email, password);
      
      if (authData?.record?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.log('Login error:', err);
      
      if (err.status === 400 || err.response?.code === 400) {
        setError(t('auth.invalidCredentials', 'Invalid email or password'));
      } else {
        setError(err.message || t('common.error', 'An error occurred during login. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.loginTitle', 'Login - TennisHub')}</title>
        <meta name="description" content={t('auth.loginDesc', 'Sign in to your account')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30 dark:bg-slate-950 transition-colors duration-300">
        <Header />

        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-lg dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="space-y-2 text-center pb-6">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <LogIn className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold dark:text-slate-50">{t('auth.loginHeading', 'Welcome Back')}</CardTitle>
                <CardDescription className="dark:text-slate-400">
                  {t('auth.loginDesc', 'Sign in to your account to continue')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-slate-50">{t('common.email', 'Email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="dark:text-slate-50">{t('common.password', 'Password')}</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                        tabIndex={-1}
                      >
                        {t('auth.forgotPassword', 'Forgot password?')}
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 dark:bg-primary dark:text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.signingIn', 'Signing in...')}
                      </>
                    ) : (
                      t('nav.login', 'Sign In')
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border dark:border-slate-700 pt-6">
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {t('auth.noAccount', "Don't have an account?")}{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    {t('auth.signUpLink', 'Sign up')}
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;

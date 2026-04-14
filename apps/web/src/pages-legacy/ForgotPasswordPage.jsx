export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { requestPasswordReset } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email) {
      setError(t('common.error', 'An error occurred'));
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(t('common.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.forgotTitle', 'Forgot Password')}</title>
        <meta name="description" content={t('auth.forgotDesc', 'Reset your password')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="border-border shadow-lg">
              <CardHeader className="space-y-2 text-center pb-6">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <KeyRound className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{t('auth.forgotHeading', 'Forgot Password')}</CardTitle>
                <CardDescription>
                  {t('auth.forgotDesc', 'Enter your email to reset your password')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 py-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <AlertDescription className="ml-2">
                      {t('auth.resetSuccess', 'Password reset link sent to your email.')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive" className="py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('common.email', 'Email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-background text-foreground"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('auth.sendingLink', 'Sending...')}
                        </>
                      ) : (
                        t('auth.sendLink', 'Send Reset Link')
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border pt-6">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('auth.backToLogin', 'Back to Login')}
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ForgotPasswordPage;

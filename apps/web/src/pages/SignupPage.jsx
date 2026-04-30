
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
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
import { Trophy, AlertCircle, Loader2 } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    password: '',
    passwordConfirm: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const { email, password, passwordConfirm, name, country } = formData;

    if (!email || !password || !name) {
      setError(t('common.error', 'Please fill in all required fields'));
      return;
    }

    if (password !== passwordConfirm) {
      setError(t('auth.passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    console.log('Signup payload:', { email, password, name });
    setIsSubmitting(true);
    
    try {
      await signup(email, password, name, country);
      navigate('/profile');
    } catch (err) {
      console.log('Signup error:', err);
      
      const emailError = err.response?.data?.email?.code;
      if (emailError === 'validation_invalid_email') {
        setError(t('auth.invalidEmail', 'Please enter a valid email address'));
      } else if (emailError === 'validation_not_unique' || err.message?.toLowerCase().includes('email')) {
        setError(t('auth.emailExists', 'Email already exists. Please try logging in.'));
      } else {
        setError(err.message || t('common.error', 'An error occurred during signup.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.signupTitle', 'Sign Up - TennisHub')}</title>
        <meta name="description" content={t('auth.signupDesc', 'Create a new account')} />
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
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold dark:text-slate-50">{t('auth.signupHeading', 'Create an Account')}</CardTitle>
                <CardDescription className="dark:text-slate-400">
                  {t('auth.signupDesc', 'Join the tennis community today')}
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
                    <Label htmlFor="name" className="dark:text-slate-50">{t('auth.fullName', 'Full Name')} *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Roger Federer"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-slate-50">{t('common.email', 'Email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="dark:text-slate-50">{t('common.country', 'Country')}</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="Switzerland"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="dark:text-slate-50">{t('common.password', 'Password')} *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm" className="dark:text-slate-50">{t('common.confirmPassword', 'Confirm Password')} *</Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="••••••••"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="bg-background text-foreground dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 dark:bg-primary dark:text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.creatingAccount', 'Creating account...')}
                      </>
                    ) : (
                      t('nav.signup', 'Sign Up')
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border dark:border-slate-700 pt-6">
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {t('auth.hasAccount', 'Already have an account?')} {' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    {t('auth.signInLink', 'Sign in')}
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

export default SignupPage;

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
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
    
    if (formData.password !== formData.passwordConfirm) {
      setError(t('common.error'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('common.error'));
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(formData);
      navigate('/profile');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.signupTitle')}</title>
        <meta name="description" content={t('auth.signupDesc')} />
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
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{t('auth.signupHeading')}</CardTitle>
                <CardDescription>
                  {t('auth.signupDesc')}
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
                    <Label htmlFor="name">{t('auth.fullName')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Roger Federer"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('common.country')}</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="Switzerland"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background text-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('common.password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="bg-background text-foreground"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">{t('common.confirmPassword')}</Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="••••••••"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="bg-background text-foreground"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.creatingAccount')}
                      </>
                    ) : (
                      t('nav.signup')
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    {t('auth.signInLink')}
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

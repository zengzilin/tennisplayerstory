// @ts-nocheck
"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LockKeyhole, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type LangCode = 'en' | 'zh' | 'ja' | 'es' | 'fr';

const localizedRouteNames: Record<string, Record<LangCode, string>> = {
  login: { en: 'login', zh: '登录', ja: 'ログイン', es: 'iniciar-sesion', fr: 'connexion' },
};

interface ResetPasswordPageClientProps {
  lang: LangCode;
  token: string;
}

const ResetPasswordPageClient = ({ lang, token }: ResetPasswordPageClientProps) => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { confirmPasswordReset } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError(t('common.error'));
      return;
    }

    if (password.length < 8) {
      setError(t('common.error'));
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token, password, passwordConfirm);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${lang}/${localizedRouteNames.login[lang]}`);
      }, 3000);
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      setError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
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
                  <LockKeyhole className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.resetHeading')}</CardTitle>
              <CardDescription>
                {t('auth.resetDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 py-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertDescription className="ml-2">
                    {t('auth.resetComplete')}
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
                    <Label htmlFor="password">{t('auth.newPassword')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">{t('auth.confirmNewPassword')}</Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.resetting')}
                      </>
                    ) : (
                      t('auth.resetBtn')
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border pt-6">
              <Link
                href={`/${lang}/${localizedRouteNames.login[lang]}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.backToLogin')}
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPasswordPageClient;

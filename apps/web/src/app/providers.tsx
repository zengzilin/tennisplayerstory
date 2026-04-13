'use client';

import { AuthProvider } from '@/contexts/AuthContext.jsx';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// @ts-nocheck
import React from 'react';
import { Helmet } from 'react-helmet-async';

const GoogleSearchConsole = () => {
  // TODO: Replace with actual Google Search Console verification code
  const VERIFICATION_CODE = 'YOUR_VERIFICATION_CODE';

  if (!VERIFICATION_CODE || VERIFICATION_CODE === 'YOUR_VERIFICATION_CODE') return null;

  return (
    <Helmet>
      <meta name="google-site-verification" content={VERIFICATION_CODE} />
    </Helmet>
  );
};

export default GoogleSearchConsole;
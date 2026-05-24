// @ts-nocheck
import React from 'react';
import { Helmet } from 'react-helmet-async';

const GoogleAnalytics = () => {
  // TODO: Replace with actual Google Analytics Measurement ID
  const GA_ID = 'G-XXXXXXXXXX';

  if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return null;

  return (
    <Helmet>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </script>
    </Helmet>
  );
};

export default GoogleAnalytics;
// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/i18n/i18n.js'; // MUST BE IMPORTED BEFORE APP
import App from '@/App.tsx';
import '@/index.css';

console.log('[main.tsx] i18n imported, rendering React app...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import { initAnalytics } from './lib/analytics';
import './utils/i18n';
import './index.css';

// No-op until the visitor accepts analytics cookies; consent.js fires
// dm-consent-accepted when they do (possibly long after page load).
initAnalytics();
window.addEventListener('dm-consent-accepted', initAnalytics);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

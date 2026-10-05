import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import { initAnalytics, withdrawAnalytics } from './lib/analytics';
import './utils/i18n';
import { getLocale } from './lib/locale';
import { ensureLocaleResources } from './locales';
import './index.css';

// No-op until the visitor accepts analytics cookies; consent.js fires
// dm-consent-accepted when they do (possibly long after page load).
initAnalytics();
window.addEventListener('dm-consent-accepted', initAnalytics);
window.addEventListener('dm-consent-declined', withdrawAnalytics);

// The shell's visually-hidden identity <h1> (index.html) is for a crawler that
// never runs this file. Every screen renders its own <h1>, so once the app
// mounts the shell's would make two (measured on /signup and /login,
// docs/redesign-2026-10/baseline.md). Prerendered routes drop it at build time
// (scripts/prerender-spa-routes.mjs); this covers every other route.
document.querySelector('body > h1[style*="position:absolute"]')?.remove();

// The interface language is resolved before anything renders (src/lib/locale.js:
// `?lang=` → saved choice → default). A non-inline bundle (Arabic) is loaded
// FIRST, so the first meaningful screen is already in the learner's language —
// no English flash, and English/German visitors download nothing extra.
const render = () => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

ensureLocaleResources(getLocale()).finally(render);

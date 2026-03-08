import { useEffect } from 'react';

// Load LemonSqueezy.js script for popup checkout
const LemonSqueezyProvider = ({ children }) => {
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="lemon.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src*="lemon.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return children;
};

export default LemonSqueezyProvider;

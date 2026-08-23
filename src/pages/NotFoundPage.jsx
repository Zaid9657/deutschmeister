import { Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <SEO title="Page Not Found" description="This page does not exist. Explore German grammar lessons from A1 to B2 on DeutschMeister." path="/404" noindex />
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-lg bg-siegel flex items-center justify-center">
          <span className="text-white font-display font-bold text-4xl">?</span>
        </div>
        <h1 className="font-display text-6xl font-semibold text-ink mb-2">404</h1>
        <h2 className="font-display text-xl font-semibold text-graphite mb-4">
          Page Not Found
        </h2>
        <p className="text-graphite mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* href, not a router <Link to="/">: "/" is served by the Astro build, so
              client-side routing to it lands back on this very page. The one job of
              a 404 is to get the visitor out. */}
          <Button href="/" size="lg">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button onClick={() => window.history.back()} variant="secondary" size="lg">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import SupportRequestForm from '../components/SupportRequestForm.jsx';
import { SUPPORT_LINK } from '../data/navigation';
import { ORGANIZATION_FULL } from '../data/organization.js';
import { categoryForTopic } from '../lib/supportTicket.js';

// /support — THE way to reach a human (src/data/navigation.js SUPPORT_LINK).
// Deliberately guard-free: the ticket form used to live only on /profile,
// behind SubscriptionGuard, so every account whose trial had ended — and every
// signed-out visitor — had no way to write to us at all (0 tickets from 1,685
// accounts). Signed in: the ticket form (identity from the JWT, server-side).
// Signed out: sign in, or the published customer-service address — the same
// one the Organization schema and the Impressum carry, never a retyped one.
const CONTACT_EMAIL = ORGANIZATION_FULL.contactPoint.email;

const SupportPage = () => {
  const { user, loading } = useAuth();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const [searchParams] = useSearchParams();
  const initialCategory = categoryForTopic(searchParams.get('topic'));

  return (
    <div className="min-h-screen bg-paper px-4 pt-24 pb-16">
      <SEO
        title={isGerman ? SUPPORT_LINK.labelDe : SUPPORT_LINK.labelEn}
        description="Questions, a problem or feedback? Write to the DeutschMeister team."
        path={SUPPORT_LINK.href}
        noindex
      />
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-clay bg-siegel-wash">
            <LifeBuoy className="h-6 w-6 text-siegel" aria-hidden="true" />
          </div>
          <SectionHeading
            level={1}
            size="page"
            title={isGerman ? SUPPORT_LINK.labelDe : SUPPORT_LINK.labelEn}
            lead={
              isGerman
                ? 'Eine Frage, ein Fehler in einer Lektion, ein Problem mit der Zahlung oder ein Vorschlag? Schreiben Sie uns — die Antwort kommt per E-Mail.'
                : 'A question, a mistake in a lesson, a payment problem or an idea? Write to us — we reply by email.'
            }
          />
        </div>

        <Card raised className="p-6 sm:p-8">
          {loading ? null : user ? (
            <SupportRequestForm initialCategory={initialCategory} />
          ) : (
            <div>
              <p className="text-[0.9375rem] leading-relaxed text-graphite">
                {isGerman
                  ? 'Melden Sie sich an, damit wir Ihre Anfrage Ihrem Konto zuordnen können — Sie sehen den Stand danach hier.'
                  : 'Sign in so we can link your request to your account — you can follow its status here afterwards.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button to="/login" state={{ from: { pathname: SUPPORT_LINK.href } }}>
                  {isGerman ? 'Anmelden' : 'Sign in'}
                </Button>
                <Link to="/signup" className="text-sm font-bold text-siegel hover:text-siegel-deep">
                  {isGerman ? 'Konto erstellen' : 'Create an account'}
                </Link>
              </div>
              <p className="mt-6 flex items-start gap-2 border-t border-rule pt-5 text-sm text-graphite">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  {isGerman ? 'Kein Konto oder kein Zugang? Schreiben Sie an ' : 'No account, or locked out? Email '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-siegel hover:text-siegel-deep">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </span>
              </p>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-graphite">
          {isGerman ? 'Vielleicht steht die Antwort schon in den ' : 'The answer may already be in the '}
          <Link to="/faq/" className="font-bold text-siegel hover:text-siegel-deep">
            {isGerman ? 'häufigen Fragen' : 'FAQ'}
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default SupportPage;

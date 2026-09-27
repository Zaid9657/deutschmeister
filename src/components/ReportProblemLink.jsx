import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORT_LINK } from '../data/navigation';

/**
 * "Something wrong? Tell us" — the small escape hatch on screens where things
 * go wrong (payment confirmation, speaking errors). Leads to /support with the
 * category preselected via ?topic=. `newTab` is for screens where leaving
 * would throw work away (a running speaking session).
 */
export default function ReportProblemLink({ topic = 'technical', newTab = false, className = '' }) {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const to = `${SUPPORT_LINK.href}?topic=${encodeURIComponent(topic)}`;
  const text = isGerman ? 'Etwas stimmt nicht? Schreiben Sie uns' : 'Something wrong? Tell us';
  const cls = `inline-block text-sm font-bold text-siegel underline-offset-2 hover:text-siegel-deep hover:underline ${className}`.trim();
  return newTab ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>{text}</a>
  ) : (
    <Link to={to} className={cls}>{text}</Link>
  );
}

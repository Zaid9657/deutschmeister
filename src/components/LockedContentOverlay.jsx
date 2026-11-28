import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';
import { courseForLevel, PRICE_TAX_NOTE, PRICE_TAX_NOTE_DE } from '../data/pricing.js';
import { trackPaywallShown } from '../lib/funnelTracking';
import { setBuyIntent } from '../lib/buyIntent.js';
import { levelLockSignupHref } from '../lib/lockDoor.js';
import { setReturnPath } from '../lib/returnPath.js';
import CoursePrice from './CoursePrice.jsx';
import Button from './ui/Button';
import Card from './ui/Card.jsx';

export default function LockedContentOverlay({ level }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isGerman = i18n.language === 'de';
  const course = courseForLevel(level);
  const variant = course && LEMONSQUEEZY_CONFIG.levelCourses[course.key]?.variantId;
  useEffect(() => { trackPaywallShown(level || 'unknown'); }, [level]);
  return <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
    <Card className="p-8 max-w-md w-full text-center">
      <h2 className="font-display text-2xl">{course?.code} {isGerman ? 'Kurs' : 'course'}</h2>
      {course && <>
        <p className="my-4"><CoursePrice level={level} language={i18n.language} /></p>
        <p>{isGerman ? `Einmal zahlen. Nur dieser Kurs, mit ${course.proDays} Tagen KI-Werkzeugen inklusive.` : `Pay once for this course only, with ${course.proDays} days of AI tools included.`}</p>
        <p className="my-3 text-sm" data-price-tax-note>{isGerman ? PRICE_TAX_NOTE_DE : PRICE_TAX_NOTE}</p>
        {course.comingSoon ? <p>{isGerman ? 'Bald verfügbar' : 'Coming next'}</p> : variant ? user
          ? <Button to={`/subscription?buy=${course.key}`} state={{ from: location }} className="mt-4">{isGerman ? `${course.code} kaufen` : `Buy ${course.code}`}</Button>
          : <Button href={levelLockSignupHref(level)} onClick={() => { setBuyIntent(course.key); setReturnPath(location.pathname); }} className="mt-4">{isGerman ? `${course.code} kaufen` : `Buy ${course.code}`}</Button>
          : null}
      </>}
      {!user && <Button to="/login" state={{ from: location }} variant="secondary" className="mt-3">{isGerman ? 'Anmelden' : 'Log In'}</Button>}
    </Card>
  </div>;
}

// Learner-facing coupon field (Preise/Abo). Validation is a SERVER answer
// (coupon-validate, identity from the JWT); this component never decides a
// discount itself. On success it hands back { code, productKey } so the
// checkout URL carries checkout[discount_code] and checkout[custom][coupon],
// which is how the order webhook attributes the redemption deterministically.
import { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../utils/supabase';
import { deEur, eur } from '../data/pricing.js';
import Button from './ui/Button.jsx';

// What an accepted code does, in the server's numbers: coupon-validate returns
// the saving and the price at checkout for the selected offer, in minor units,
// computed from the synced pricing catalogue (ACC-15). Formatted by the
// pricing.js helpers; no price is typed here. Without both amounts the line
// only says the code applies.
export const couponAppliedLine = (result, isGerman) => {
  const label = result.label || result.code;
  const money = (minor) => (isGerman ? deEur(minor / 100) : eur(minor / 100));
  const amounts = Number.isFinite(result.discount) && Number.isFinite(result.final) && result.discount > 0;
  if (!amounts) return isGerman ? `✓ ${label} wird im Checkout angewendet` : `✓ ${label} applies at checkout`;
  return isGerman
    ? `✓ ${label}: Sie sparen ${money(result.discount)}, Preis im Checkout ${money(result.final)}`
    : `✓ ${label}: you save ${money(result.discount)}, price at checkout ${money(result.final)}`;
};

export default function CouponField({ onApplied, productKey, isGerman = false }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const requestRef = useRef(0);
  useEffect(() => {
    requestRef.current += 1;
    setResult(null);
    onApplied?.(null);
    return () => { requestRef.current += 1; };
  }, [productKey, onApplied]);
  const check = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const requestId = ++requestRef.current;
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
      const res = await fetch('/.netlify/functions/coupon-validate', { method: 'POST', headers, body: JSON.stringify({ code, productKey }) });
      const json = await res.json().catch(() => ({}));
      if (requestId !== requestRef.current) return;
      if (!res.ok) throw new Error(json.error || `Fehler ${res.status}`);
      setResult(json);
      onApplied?.(json.ok ? { code: json.code, productKey: json.productKey } : null);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setResult({ ok: false, message: err.message });
      onApplied?.(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={check} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="coupon-code">{isGerman ? 'Gutscheincode' : 'Coupon code'}</label>
      <input id="coupon-code" value={code} onChange={(e) => { requestRef.current += 1; setCode(e.target.value.toUpperCase()); setResult(null); onApplied?.(null); }} placeholder={isGerman ? 'Gutscheincode' : 'Coupon code'} className="w-44 rounded-lg border border-rule bg-white px-3 py-2 font-data text-sm uppercase text-ink focus:border-siegel focus:outline-none" maxLength={32} />
      <Button type="submit" variant="secondary" size="sm" disabled={busy || !code.trim() || !productKey}>{busy ? '…' : isGerman ? 'Prüfen' : 'Apply'}</Button>
      {result ? <span className={`text-sm ${result.ok ? 'text-siegel-deep' : 'text-graphite'}`}>{result.ok ? couponAppliedLine(result, isGerman) : result.message}</span> : null}
    </form>
  );
}

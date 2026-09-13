// Learner-facing coupon field (Preise/Abo). Validation is a SERVER answer
// (coupon-validate, identity from the JWT); this component never decides a
// discount itself. On success it hands back { code, normalized } so the
// checkout URL carries checkout[discount_code] and checkout[custom][coupon],
// which is how the order webhook attributes the redemption deterministically.
import { useState } from 'react';
import { getAuthHeaders } from '../utils/supabase';
import Button from './ui/Button.jsx';

export default function CouponField({ onApplied, variantId, isGerman = false }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const check = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
      const res = await fetch('/.netlify/functions/coupon-validate', { method: 'POST', headers, body: JSON.stringify({ code, variantId: variantId || null }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Fehler ${res.status}`);
      setResult(json);
      onApplied?.(json.ok ? { code: json.code } : null);
    } catch (err) {
      setResult({ ok: false, message: err.message });
      onApplied?.(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={check} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="coupon-code">{isGerman ? 'Gutscheincode' : 'Coupon code'}</label>
      <input id="coupon-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); onApplied?.(null); }} placeholder={isGerman ? 'Gutscheincode' : 'Coupon code'} className="w-44 rounded-lg border border-rule bg-white px-3 py-2 font-data text-sm uppercase text-ink focus:border-siegel focus:outline-none" maxLength={32} />
      <Button type="submit" variant="secondary" size="sm" disabled={busy || !code.trim()}>{busy ? '…' : isGerman ? 'Prüfen' : 'Apply'}</Button>
      {result ? <span className={`text-sm ${result.ok ? 'text-siegel-deep' : 'text-graphite'}`}>{result.ok ? (isGerman ? `✓ ${result.label || result.code} wird im Checkout angewendet` : `✓ ${result.label || result.code} applies at checkout`) : result.message}</span> : null}
    </form>
  );
}

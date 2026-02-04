import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft, Check, Shield } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const PLANS = {
  monthly: { price: 10, months: 1 },
  quarterly: { price: 20, months: 3 },
};

const PaymentPage = () => {
  const { planType } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { createSubscription } = useSubscription();
  const isGerman = i18n.language === 'de';

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS[planType];
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-16">
        <p className="text-slate-600">Invalid plan type.</p>
      </div>
    );
  }

  const planName = planType === 'monthly'
    ? isGerman ? 'Monatsplan' : 'Monthly Plan'
    : isGerman ? 'Vierteljahresplan' : 'Quarterly Plan';

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) {
      setError(isGerman ? 'Bitte gib eine gültige Kartennummer ein.' : 'Please enter a valid card number.');
      return;
    }
    if (expiry.length < 5) {
      setError(isGerman ? 'Bitte gib ein gültiges Ablaufdatum ein.' : 'Please enter a valid expiry date.');
      return;
    }
    if (cvc.length < 3) {
      setError(isGerman ? 'Bitte gib einen gültigen CVC ein.' : 'Please enter a valid CVC.');
      return;
    }
    if (!name.trim()) {
      setError(isGerman ? 'Bitte gib den Namen auf der Karte ein.' : 'Please enter the name on the card.');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = await createSubscription(planType, plan.price);
      if (result) {
        navigate('/dashboard', { state: { subscribed: true } });
      } else {
        setError(isGerman ? 'Zahlung fehlgeschlagen. Bitte versuche es erneut.' : 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError(isGerman ? 'Ein Fehler ist aufgetreten.' : 'An error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/subscription')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isGerman ? 'Zurück zu den Plänen' : 'Back to plans'}
        </button>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-800">
                  {isGerman ? 'Zahlungsinformationen' : 'Payment Details'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isGerman ? 'Name auf der Karte' : 'Name on Card'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isGerman ? 'Kartennummer' : 'Card Number'}
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {isGerman ? 'Ablaufdatum' : 'Expiry'}
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isGerman ? 'Wird verarbeitet...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {isGerman ? `€${plan.price} bezahlen` : `Pay €${plan.price}`}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-3">
                  <Shield className="w-3 h-3" />
                  {isGerman ? 'Sichere Zahlung mit SSL-Verschlüsselung' : 'Secure payment with SSL encryption'}
                </div>
              </form>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-800 mb-4">
                {isGerman ? 'Bestellübersicht' : 'Order Summary'}
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">{isGerman ? 'Plan' : 'Plan'}</span>
                  <span className="font-medium text-slate-800">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{isGerman ? 'Dauer' : 'Duration'}</span>
                  <span className="font-medium text-slate-800">
                    {plan.months} {plan.months === 1
                      ? isGerman ? 'Monat' : 'month'
                      : isGerman ? 'Monate' : 'months'}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-800">{isGerman ? 'Gesamt' : 'Total'}</span>
                  <span className="font-bold text-lg text-slate-900">€{plan.price}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                {[
                  isGerman ? 'Sofortiger Zugang' : 'Instant access',
                  isGerman ? 'Jederzeit kündbar' : 'Cancel anytime',
                  isGerman ? 'Alle Stufen freigeschalten' : 'All levels unlocked',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

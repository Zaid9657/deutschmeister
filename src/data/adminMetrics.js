// Admin panel — the metric names (CLIENT COPY of netlify/functions/_shared/adminMetricNames.mjs;
// byte-identical below the header, drift-tested by tests/admin-metrics.test.mjs).
// copy is src/data/adminMetrics.js and tests/admin-metrics.test.mjs fails if
// the two drift. Name a metric after what it measures: "gestartet" is not
// "abgeschlossen", "login-aktiv" is not "aktiv".
export const METRICS = Object.freeze({
  revenueNet: {
    label: 'Umsatz (netto)',
    definition: 'Bezahlte Lemon-Squeezy-Bestellungen (order_created) plus Verlängerungen (subscription_payment_success, billing_reason = renewal), abzüglich Steuer und Erstattungen; Test-Modus ausgeschlossen; je Währung getrennt.',
    source: 'webhook_logs.payload (Lemon Squeezy)',
    caveat: 'Die erste Abo-Zahlung feuert order_created UND subscription_payment_success (initial) für dasselbe Geld — nur order_created wird gezählt.',
    timeClass: 'Zeitraum',
  },
  mrr: {
    label: 'MRR',
    definition: 'Summe der laufenden, bezahlten, verlängernden Abos (status active, price_paid > 0, subscription_end > jetzt), jährlich/12.',
    source: 'subscriptions',
    caveat: 'Identisch mit weekly_truth_metrics().subscriptions.mrr. Manuell freigeschaltete Zugänge (price_paid 0) zählen nicht.',
    timeClass: 'Aktueller Stand',
  },
  activeSubs: {
    label: 'Aktive Abonnements',
    definition: 'Abo-Zeilen mit laufender Periode (subscription_end > jetzt), inkl. gekündigt-aber-bezahlt und Kurs-Pro-Fenster.',
    source: 'subscriptions',
    timeClass: 'Aktueller Stand',
  },
  newUsers: {
    label: 'Neue Nutzer',
    definition: 'Konten mit created_at im Zeitraum.',
    source: 'auth.users via profiles.created_at',
    timeClass: 'Zeitraum',
  },
  totalUsers: {
    label: 'Registrierte gesamt',
    definition: 'Alle Konten, seit Beginn.',
    source: 'profiles',
    timeClass: 'Seit Beginn',
  },
  loginActive7: {
    label: 'Login-aktive Nutzer (7 T)',
    definition: 'Konten mit einem Login-Ereignis in den letzten 7 Tagen. Ein Login ist keine Lernaktivität.',
    source: 'audit_logs (auth.login)',
    timeClass: 'Rollierend 7 Tage',
  },
  loginActive28: {
    label: 'Login-aktive Nutzer (28 T)',
    definition: 'Konten mit einem Login-Ereignis in den letzten 28 Tagen.',
    source: 'audit_logs (auth.login)',
    timeClass: 'Rollierend 28 Tage',
  },
  activated: {
    label: 'Aktiviert',
    definition: 'Konten mit mindestens einer gezählten Nutzung: Grammatik-Fortschritt, Hör-/Leseabschluss, Sprechsitzung oder Kurs-Lektion.',
    source: 'user_grammar_progress ∪ user_listening_progress ∪ user_reading_progress ∪ speaking_sessions ∪ lesson_progress',
    timeClass: 'Seit Beginn',
  },
  paying: {
    label: 'Zahlende Nutzer',
    definition: 'Nutzer mit einem laufenden bezahlten Abo (price_paid > 0) oder einem aktiven Kurskauf.',
    source: 'subscriptions ∪ purchases',
    timeClass: 'Aktueller Stand',
  },
  speakingStarted: {
    label: 'Sprechsitzungen gestartet',
    definition: 'speaking_sessions-Zeilen mit created_at im Zeitraum. Gestartet heißt nicht abgeschlossen.',
    source: 'speaking_sessions',
    timeClass: 'Zeitraum',
  },
  speakingCompletedRate: {
    label: 'Abschlussquote Sprechen',
    definition: 'Sitzungen mit status completed geteilt durch gestartete Sitzungen im Zeitraum.',
    source: 'speaking_sessions.status',
    caveat: 'Placement-Sitzungen (Einstufungstest) sind enthalten; der Modus-Filter trennt sie.',
    timeClass: 'Zeitraum',
  },
  evaluationCoverage: {
    label: 'Bewertungsabdeckung',
    definition: 'Abgeschlossene Sprechsitzungen mit mindestens einer Bewertung geteilt durch abgeschlossene Sitzungen (nur abgeschlossene sind bewertbar).',
    source: 'speaking_evaluations / speaking_sessions (completed)',
    caveat: 'Zähler nach Sitzung dedupliziert; eine Sitzung mit zwei Bewertungszeilen zählt einmal.',
    timeClass: 'Zeitraum',
  },
  avgSpeakingScore: {
    label: 'Ø Sprechergebnis',
    definition: 'Mittel der Bewertungsquoten (score / 100) über bewertete Sitzungen; unbrauchbare Zeilen (score null) ausgeschlossen, nie auf 0 gesetzt.',
    source: 'speaking_evaluations.total_score / score',
    timeClass: 'Zeitraum',
  },
  grammarActive: {
    label: 'Grammatik-aktive Nutzer',
    definition: 'Nutzer mit last_accessed oder created_at eines Grammatik-Fortschritts im Zeitraum.',
    source: 'user_grammar_progress',
    timeClass: 'Zeitraum',
  },
  oneAndDone: {
    label: 'One-and-done',
    definition: 'Nutzer der Registrierungs-Kohorte des Zeitraums, die genau ein Grammatik-Thema begonnen haben (identisch mit weekly_truth_metrics).',
    source: 'user_grammar_progress',
    timeClass: 'Registrierungs-Kohorte',
  },
  webhookFailures: {
    label: 'Webhook-Fehler',
    definition: 'webhook_logs-Zeilen mit processed = false im Zeitraum.',
    source: 'webhook_logs',
    timeClass: 'Zeitraum',
  },
  failedPayments: {
    label: 'Zahlungen überfällig',
    definition: 'Abos mit status past_due oder unpaid (isFailedPayment). Dieselbe Funktion wie die Warteschlange unter Abonnements.',
    source: 'subscriptions.status',
    timeClass: 'Aktueller Stand',
  },
});

export const METRIC_KEYS = Object.freeze(Object.keys(METRICS));

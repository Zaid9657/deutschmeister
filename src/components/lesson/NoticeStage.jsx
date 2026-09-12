import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';

/** **bold** → <strong>, *italic* → <em>. The curriculum's notice body is plain
 * text with at most those two marks, so nothing here needs a markdown parser
 * and nothing renders raw HTML. */
function inline(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

/**
 * Stage 3 — Notice. ONE grammar point, ≤ 60 words, with two examples taken
 * verbatim from the dialogue the learner just read, so the rule lands on
 * language already met. Reference material, so the card is FLAT (tokens rule 3).
 */
export default function NoticeStage({ stage, onBack, onDone }) {
  const notice = stage.notice || {};
  return (
    <StageShell eyebrow="Schritt 3 · Grammatik" title={notice.title} onBack={onBack} primaryLabel="Verstanden" onPrimary={onDone}>
      <Card className="p-5 sm:p-6">
        <p className="text-[1rem] leading-relaxed text-graphite">{inline(notice.bodyDe)}</p>
        {(notice.examples || []).length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-rule pt-4">
            {notice.examples.map((ex) => (
              <li key={ex} className="text-[1.0625rem] leading-relaxed text-ink">
                <span aria-hidden="true" className="mr-2 text-siegel">›</span>
                {ex}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-3 font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">
        Beispiele aus dem Dialog
      </p>
    </StageShell>
  );
}

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';

/**
 * The lines of one listening_dialogues row, ready to render: [{ label, text, translation }].
 *
 * The live table has no per-line columns: `transcript` is a jsonb array of lines like
 * { "text": "Entschuldigung, was kostet das Brot?", "speaker": "male" } (checked against the live
 * database on 2026-10-25). This component used to read german_text / english_text / speaker,
 * which do not exist, and rendered empty lines under every listening result. Each distinct voice
 * of a dialogue gets a letter in order of first appearance — "Sprecher A", "Sprecherin B" — so
 * the labels follow the voices of the recording. A missing or malformed transcript renders no
 * lines; a row in the old one-line shape (german_text …) still renders if one ever turns up.
 */
function transcriptLines(dialogue, isGerman) {
  const roles = isGerman
    ? { male: 'Sprecher', female: 'Sprecherin', other: 'Person' }
    : { male: 'Speaker', female: 'Speaker', other: 'Speaker' };
  let raw = dialogue?.transcript;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = raw.trim() ? [{ text: raw }] : null;
    }
  }
  if (Array.isArray(raw)) {
    const voices = [];
    return raw.flatMap((entry) => {
      const line = typeof entry === 'string' ? { text: entry } : entry;
      const text = typeof line?.text === 'string' ? line.text.trim() : '';
      if (!text) return [];
      const speaker = typeof line.speaker === 'string' ? line.speaker.trim().toLowerCase() : '';
      if (!speaker) return [{ label: null, text, translation: null }];
      if (!voices.includes(speaker)) voices.push(speaker);
      const role = speaker === 'male' ? roles.male : speaker === 'female' ? roles.female : roles.other;
      return [{ label: `${role} ${String.fromCharCode(65 + voices.indexOf(speaker))}`, text, translation: null }];
    });
  }
  if (typeof dialogue?.german_text === 'string' && dialogue.german_text.trim()) {
    return [{ label: dialogue.speaker || null, text: dialogue.german_text.trim(), translation: dialogue.english_text || null }];
  }
  return [];
}

// The transcript is reference material, so it stays FLAT (design-tokens.js
// rule 3): a hairline card, generous line height, no resting shadow.
const DialogueTranscript = ({ dialogues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  // Only dialogues that have something to show; no lines at all → no toggle onto an empty card.
  const scenes = (dialogues || [])
    .map((dialogue) => ({ dialogue, lines: transcriptLines(dialogue, isGerman) }))
    .filter((scene) => scene.lines.length > 0);
  if (scenes.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper-sunk transition-colors"
      >
        <div className="flex items-center gap-2 text-ink font-bold">
          <FileText size={18} className="text-siegel" />
          {isGerman ? 'Transkript anzeigen' : 'Show Transcript'}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-graphite" /> : <ChevronDown size={18} className="text-graphite" />}
      </button>

      {/* Transcript content: each dialogue's title, then its lines */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-5 border-t border-rule pt-4 animate-pop-in">
          {scenes.map(({ dialogue, lines }, index) => {
            const heading = [
              dialogue.dialogue_number != null ? `${isGerman ? 'Dialog' : 'Dialogue'} ${dialogue.dialogue_number}` : null,
              dialogue.title,
            ].filter(Boolean).join(' · ');
            return (
              <div key={dialogue.id || dialogue.dialogue_number || index} className="space-y-2">
                {heading && <p className="text-sm font-bold text-ink">{heading}</p>}
                {lines.map((line, i) => (
                  <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    {line.label && (
                      <span className="flex-shrink-0 font-data text-[0.75rem] font-bold text-siegel sm:w-28 sm:text-right">
                        {line.label}:
                      </span>
                    )}
                    <div className="flex-1">
                      <p className="text-ink text-sm leading-relaxed">{line.text}</p>
                      {line.translation && (
                        <p className="text-graphite text-xs mt-0.5 italic">{line.translation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default DialogueTranscript;

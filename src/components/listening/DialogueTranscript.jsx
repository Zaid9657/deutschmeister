import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';

// The transcript is reference material, so it stays FLAT (design-tokens.js
// rule 3): a hairline card, generous line height, no resting shadow.
const DialogueTranscript = ({ dialogues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  if (!dialogues || dialogues.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper-sunk transition-colors"
      >
        <div className="flex items-center gap-2 text-ink font-bold">
          <FileText size={18} className="text-siegel" />
          {isGerman ? 'Transkript anzeigen' : 'Show Transcript'}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-graphite" /> : <ChevronDown size={18} className="text-graphite" />}
      </button>

      {/* Transcript content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-3 border-t border-rule pt-4 animate-pop-in">
          {dialogues.map((dialogue) => (
            <div key={dialogue.id || dialogue.dialogue_number} className="flex gap-3">
              {/* Speaker label */}
              <span className="flex-shrink-0 w-20 text-right font-data text-[0.75rem] font-bold text-siegel">
                {dialogue.speaker || `Speaker ${dialogue.dialogue_number}`}:
              </span>
              <div className="flex-1">
                <p className="text-ink text-sm leading-relaxed">{dialogue.german_text}</p>
                {dialogue.english_text && (
                  <p className="text-graphite text-xs mt-0.5 italic">{dialogue.english_text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default DialogueTranscript;

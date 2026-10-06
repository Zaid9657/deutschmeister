// Inline marks for course text (bold, italic, German quotations) — one renderer
// for the notice, the feedback and every support text (SupportText.jsx).
const ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_LETTER = /[A-Za-zÄÖÜäöüß]/;

/** A Latin-script run inside Arabic text is German content: isolate it (bidi) and mark its language. */
const isolate = (node, key) => <bdi key={key} lang="de" dir="ltr">{node}</bdi>;

/** **bold** → <strong>, *italic* → <em>. The curriculum's notice body is plain
 * text with at most those two marks, so nothing here needs a markdown parser
 * and nothing renders raw HTML. Exported: the practice feedback renders the
 * pool's `explanationEn` / `explanationDe`, which use the same two marks.
 *
 * In Arabic text (`{ rtl: true }`) every German quotation — „…“, «…» or a bold
 * Latin-script run such as **Ich bin Lehrerin.** — is wrapped in
 * `<bdi lang="de" dir="ltr">`, so the German keeps its own word order and
 * punctuation inside the right-to-left sentence and a screen reader switches
 * voice for it (W3C inline-bidi-markup). The text itself is never reversed. */
export function inline(text, { rtl = false } = {}) {
  const pattern = rtl ? /(\*\*[^*]+\*\*|\*[^*]+\*|„[^“]+“|«[^»]+»)/g : /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = String(text || '').split(pattern);
  const german = (s) => rtl && LATIN_LETTER.test(s) && !ARABIC_LETTER.test(s);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return <strong key={i} className="font-bold text-ink">{german(inner) ? isolate(inner, 'b') : inner}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return <em key={i}>{german(inner) ? isolate(inner, 'i') : inner}</em>;
    }
    if (rtl && (part.startsWith('„') || part.startsWith('«'))) {
      const open = part[0];
      const close = part[part.length - 1];
      const inner = part.slice(1, -1);
      return <span key={i}>{open}{german(inner) ? isolate(inner, 'q') : inner}{close}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}


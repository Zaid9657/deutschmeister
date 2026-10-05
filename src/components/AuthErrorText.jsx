import { arabicAuthError } from '../locales/useArabic';

/**
 * The error line. English: the message as it always was. Arabic: a sentence
 * for every error the screen knows by its code, and for an unknown one the
 * honest "the server said, in English:" with the server's words marked English.
 */
export default function AuthErrorText({ ta, message, cause }) {
  const ar = ta ? arabicAuthError(ta, cause || { code: 'unexpected' }) : null;
  if (!ar) return <p className="text-sm font-semibold">{message}</p>;
  return (
    <p className="text-sm font-semibold">
      {ar.text}
      {ar.english && <> <span lang="en" dir="ltr">{ar.english}</span></>}
    </p>
  );
}


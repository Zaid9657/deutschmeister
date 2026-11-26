import { isolateLatin } from './NoticeStage.jsx';
import { feedbackArabic, taskArabic } from '../../lib/lesson/arabicHelp.js';

/** Native details is closed by default in both interface modes. German examples keep their direction. */
export default function ArabicHelp({ text }) {
  if (!text) return null;
  return (
    <details lang="ar" dir="rtl" className="mt-3 rounded-clay border border-rule bg-paper p-3 text-sm text-graphite">
      <summary className="min-h-11 cursor-pointer content-center font-bold text-siegel-deep">مساعدة بالعربية</summary>
      <p className="mt-2 leading-relaxed">{isolateLatin(text)}</p>
    </details>
  );
}

export const TaskArabicHelp = ({ taskEn }) => <ArabicHelp text={taskArabic(taskEn)} />;
export const FeedbackArabicHelp = ({ keys, values }) => <ArabicHelp text={keys.filter(Boolean).map((key) => feedbackArabic(key, values)).filter(Boolean).join(' ')} />;

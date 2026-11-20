import GuideOtter from './GuideOtter.jsx';

/** One line from the course otter, beside its picture where the Lektion is illustrated. */
export default function OtterSays({ lektionId, pose = 'thinking', className = '', children }) {
  if (!children) return null;
  return (
    <p className={`flex items-center gap-3 text-[0.9375rem] leading-snug text-ink ${className}`} data-otter-says>
      <GuideOtter lektionId={lektionId} pose={pose} size={56} className="h-14 w-14 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

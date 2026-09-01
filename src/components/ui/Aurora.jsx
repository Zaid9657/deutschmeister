/**
 * Drifting, blurred colour fields behind a hero or close section (SPA twin
 * of Aurora.astro). Token washes only — never a case colour. The parent must
 * be `relative overflow-hidden`; put content in a `relative` sibling.
 */
export default function Aurora({ variant = 'hero', className = '' }) {
  return (
    <div className={`aurora pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()} aria-hidden="true">
      {variant === 'hero' ? (
        <>
          <div className="aurora-blob aurora-a" />
          <div className="aurora-blob aurora-b" />
          <div className="aurora-blob aurora-c" />
        </>
      ) : (
        <div className="aurora-blob aurora-b" style={{ left: '60%', top: '-30%' }} />
      )}
    </div>
  );
}

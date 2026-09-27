import Reveal from './Reveal.jsx';

/** The page-role twin of Reveal: same element and classes, never hidden. */
function Shown({ as: Tag = 'div', className = '', children }) {
  return <Tag className={className.trim() || undefined}>{children}</Tag>;
}

/**
 * Eyebrow + title + lead, the way every section on the homepage opens.
 * `level` picks the heading element; `size` "page" is the H1 role.
 *
 * The page role is never scroll-revealed. It is the top of the page and its
 * largest paint: `.reveal` holds it at opacity 0 until the observer runs after
 * the bundle loads, so the prerendered routes (/level-test/, /faq/,
 * /speaking/ …) shipped an invisible H1 and LCP waited on the JS. Section
 * headings further down keep their entrance; a page hero that wants motion
 * wraps the heading in `hero-line`, which moves without hiding.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  level = 2,
  size = 'section',
  align = 'left',
  className = '',
}) {
  const Tag = `h${level}`;
  const Part = size === 'page' ? Shown : Reveal;
  const titleClass =
    size === 'page'
      ? 'font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]'
      : 'font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]';
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`.trim()}>
      {eyebrow && (
        <Part as="p" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {eyebrow}
        </Part>
      )}
      <Part as={Tag} delay={60} className={`${eyebrow ? 'mt-3' : ''} ${titleClass}`}>
        {title}
      </Part>
      {lead && (
        <Part
          as="p"
          delay={120}
          className={`mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-graphite sm:text-base ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {lead}
        </Part>
      )}
    </div>
  );
}

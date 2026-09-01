import Reveal from './Reveal.jsx';

/**
 * Eyebrow + title + lead, the way every section on the homepage opens.
 * `level` picks the heading element; `size` "page" is the H1 role.
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
  const titleClass =
    size === 'page'
      ? 'font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3rem]'
      : 'font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[2.125rem]';
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`.trim()}>
      {eyebrow && (
        <Reveal as="p" className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">
          {eyebrow}
        </Reveal>
      )}
      <Reveal as={Tag} delay={60} className={`${eyebrow ? 'mt-3' : ''} ${titleClass}`}>
        {title}
      </Reveal>
      {lead && (
        <Reveal
          as="p"
          delay={120}
          className={`mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-graphite sm:text-base ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {lead}
        </Reveal>
      )}
    </div>
  );
}

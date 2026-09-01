import { useReveal } from '../../lib/motion.js';

/**
 * Blur-fade entrance when scrolled into view (the SPA twin of the Astro
 * `.reveal` class). `delay` staggers siblings in ms. Renders a plain element
 * (`as`), so it composes with any layout. Content is never hidden for
 * reduced-motion users or before the observer runs — see lib/motion.js.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { '--rd': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

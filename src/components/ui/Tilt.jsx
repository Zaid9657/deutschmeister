import { useEffect, useRef } from 'react';
import Atropos from 'atropos';

/**
 * A 3D parallax scene (Atropos, MIT) — the same tilt the homepage cards
 * have. Children are the scene's content; give inner elements
 * `data-atropos-offset="6"` to float them above the card plane (negative
 * sinks them). Tilt is a direct pointer response, so it is not gated behind
 * reduced motion. `overflowVisible` lets a floating badge escape the card.
 */
export default function Tilt({ className = '', overflowVisible = true, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const inst = Atropos({ el, activeOffset: 30, rotateXMax: 9, rotateYMax: 9, shadow: false, highlight: true, duration: 250 });
    return () => inst.destroy();
  }, []);
  return (
    <div ref={ref} className={`atropos ${className}`.trim()} {...rest}>
      <div className="atropos-scale h-full">
        <div className="atropos-rotate h-full">
          <div className={`atropos-inner h-full ${overflowVisible ? '!overflow-visible' : ''}`.trim()}>{children}</div>
        </div>
      </div>
    </div>
  );
}

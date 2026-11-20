import { A11_ART } from '../../data/curricula/a11.art.js';

/** The course guide in one pose. Shown only on a Lektion whose scene is already illustrated. */
export default function GuideOtter({ lektionId, pose, size = 96, className = '' }) {
  const art = A11_ART.guide?.poses?.[pose];
  if (!art || !A11_ART.situations[lektionId]?.src) return null;
  // A phone draws 96 CSS px with up to 288 device px, so the browser picks the file, not the size prop.
  return <img src={art.srcSmall} srcSet={`${art.srcSmall} 160w, ${art.src} 512w`} sizes={`${size}px`} alt={art.alt} width={size} height={size} loading="lazy" decoding="async" className={className} />;
}

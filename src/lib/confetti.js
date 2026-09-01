// A dependency-free confetti burst for celebration moments (CompletionMoment,
// a passed mock, a completed daily goal). One canvas, one rAF loop, gone in
// ~1.6s. Colours come from the design tokens' accent palette + siegel/gold —
// confetti is exactly the "energy, never semantics" surface the accents exist
// for (design-tokens.js rule 2).
//
// Respects prefers-reduced-motion: the burst simply does not fire. Callers
// never need to check — celebration copy must carry the moment on its own.

import { accent, color } from '../data/design-tokens.js';

const PIECES = 90;
const DURATION_MS = 1600;
const COLORS = [accent.himbeer.bright, accent.aprikose.bright, accent.limette.bright, color.siegelLift, color.gold];

export default function confettiBurst({ originY = 0.35 } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * originY;
  const pieces = Array.from({ length: PIECES }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 9;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });

  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = Math.max(0, 1 - t / DURATION_MS);
    for (const p of pieces) {
      p.vy += 0.28; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < DURATION_MS) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

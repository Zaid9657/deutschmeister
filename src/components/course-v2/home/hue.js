import { courseHues } from '../../../data/design-tokens.js';

// A Kapitel's (or a Modul's) hue as CSS variables: `--hue` (the bright face) and
// `--hue-edge` (its extrusion). The path's colours vary at runtime, and Tailwind JIT
// only sees literal class strings, so the classes stay fixed
// (`bg-[color:var(--hue)]`, `shadow-[0_6px_0_var(--hue-edge)]` …) and the value comes
// from design-tokens.js here — never a hex literal in a component.
export function hueVars(name) {
  const h = courseHues[name] || courseHues.gruen;
  return { '--hue': h.bright, '--hue-edge': h.edge };
}

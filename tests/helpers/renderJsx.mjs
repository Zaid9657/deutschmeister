// Load a React component module (.jsx) under node:vm, with every import
// replaced by a stub, so a test can call the component and inspect what it
// renders. JSX is compiled by esbuild through Vite (the app's own build tool;
// no new dependency) to plain h(type, props, ...children) calls.
//
// Not a suite itself: `npm test` runs only tests/*.test.mjs.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformWithEsbuild } from 'vite';

/** The element a component returns: { type, props } with props.children. */
export const h = (type, props, ...children) => ({ type, props: { ...(props || {}), children } });
export const Fragment = Symbol('Fragment');

/**
 * @param {string} path  repo-relative, e.g. 'src/components/SubscriptionGuard.jsx'
 * @param {Record<string, object>} stubs  module specifier → its exports
 *   (named exports as properties; a default import reads `default`)
 */
export async function loadJsxModule(path, stubs) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, path, {
    loader: 'jsx', jsx: 'transform', jsxFactory: 'h', jsxFragment: 'Fragment', format: 'cjs', target: 'es2020',
  });
  const module = { exports: {} };
  const require = (spec) => {
    if (!Object.prototype.hasOwnProperty.call(stubs, spec)) throw new Error(`${path}: no stub for import '${spec}'`);
    return { __esModule: true, ...stubs[spec] };
  };
  vm.runInNewContext(code, { module, exports: module.exports, require, h, Fragment, console, Date });
  return module.exports;
}

/** One-shot hooks: state keeps its initial value; effects are collected to run after the render. */
export function oneRenderHooks() {
  const effects = [];
  return {
    effects,
    react: {
      useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: (current) => ({ current }),
      useEffect: (fn) => { effects.push(fn); },
    },
    runEffects() { effects.splice(0).forEach((fn) => fn()); },
  };
}

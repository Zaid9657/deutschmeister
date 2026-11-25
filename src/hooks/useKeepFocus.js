import { useEffect } from 'react';

/**
 * A control that disappears or is switched off under the keyboard („I said it“ becomes „Said“, Submit
 * goes, Play is off while the sound loads) drops focus to the top of the page: the next Tab starts
 * again at the site header. Inside `root` focus stays where the control was: back on it when it is
 * switched on again, else on the nearest of its old parents still on the page. When the whole screen
 * went, it goes to the next screen's heading, also one that loads late. A learner who clicks away
 * keeps that choice, and a screen that moves focus itself is left alone. Returns its own undo.
 */
export function keepFocus(root, doc = document, Observer = MutationObserver) {
  let chain = []; // the focused control, then its parents up to the root

  const onFocusIn = (e) => {
    chain = [];
    for (let el = e.target; el && el !== root.parentElement; el = el.parentElement) chain.push(el);
  };
  // Blurred by the learner: nothing to give back. Chrome also blurs a control it removes or switches off,
  // before that shows on the page, so the control is looked at a moment later.
  const onFocusOut = (e) => {
    setTimeout(() => {
      if (chain[0] === e.target && e.target.isConnected && !e.target.disabled && doc.activeElement !== e.target) chain = [];
    }, 0);
  };
  const keep = () => {
    const [control] = chain;
    if (!control || (doc.activeElement && doc.activeElement !== doc.body)) return;
    if (control.isConnected && control.disabled) return; // off for a moment: wait for it
    const parent = chain.find((el) => el.isConnected);
    const target = parent === root ? root.querySelector('h1, h2') : parent;
    if (!target) return;
    if (target !== control && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  const observer = new Observer(keep);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
  return () => {
    observer.disconnect();
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
  };
}

export default function useKeepFocus(rootRef) {
  useEffect(() => (rootRef.current ? keepFocus(rootRef.current) : undefined), [rootRef]);
}

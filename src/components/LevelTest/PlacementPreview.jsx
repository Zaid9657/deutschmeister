import { PLACEMENT_PREVIEW as sample } from '../../data/placementPreview.js';

export default function PlacementPreview() {
  return (
    <aside className="mt-7 rounded-xl border border-rule bg-white p-5" aria-label="Placement question demonstration" data-placement-preview>
      <p className="font-data text-xs font-bold uppercase tracking-widest text-siegel-deep">Sample question · from the real test bank</p>
      <p className="mt-3 font-display text-2xl" lang="de">{sample.question}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Example options">
        {sample.options.map((option) => <li key={option} className="rounded-lg border border-rule bg-paper px-3 py-2" lang="de">{option}</li>)}
      </ul>
      <details className="mt-4 border-t border-rule pt-3">
        <summary className="cursor-pointer py-2 font-bold text-siegel-deep">Show the answer and explanation</summary>
        <p className="mt-2 text-sm leading-relaxed text-graphite"><strong lang="de">{sample.answer}</strong> — {sample.explanation}</p>
      </details>
      <p className="mt-3 text-xs leading-relaxed text-graphite">Demonstration only. Your test draws its own questions. The suggested level is a starting point for practice, not a certificate.</p>
    </aside>
  );
}

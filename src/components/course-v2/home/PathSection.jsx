import { useCallback, useEffect, useState } from 'react';
import CastAvatar from '../CastAvatar.jsx';
import JumpButton from './JumpButton.jsx';
import PathNode, { StepFace } from './PathNode.jsx';
import { StopFace } from './StopNode.jsx';
import UnitBanner from './UnitBanner.jsx';
import { hueVars } from './hue.js';
import {
  nodeAnchor, nodePopover, stopPopover, finishNode, unitPercent,
} from '../../../lib/course-v2/pathModel.js';

// The learn path (pathModel.js coursePath), Duolingo's learn screen: per Kapitel its
// banner (sticky, with the book button to the Kapitel guide) and under it its steps as
// big round nodes in a zig-zag — no label cards, no skill chips, no grammar lines; a tap
// on a node opens its popover (one open at a time; a tap outside or Escape closes it).
// Each Modul ends in its Plateau chest or the Abschlusstest trophy, and a quiet divider
// line „MODUL 2 · EINKAUFEN UND WOHNEN" separates the Module. A Kapitel whose content is
// not compiled yet is grey with grey nodes whose popover says „Kommt bald". The gate
// stays SOFT: every node of a compiled Kapitel opens its step.

function UnitBlock({ unit, current, stepXp, openId, toggle, headingLevel, companion }) {
  const finish = finishNode(current, unit);
  const percent = unitPercent(unit);
  const nodes = unit.available ? unit.nodes : unit.placeholders || [];
  return (
    <div style={hueVars(unit.hue)}>
      <UnitBanner unit={unit} headingLevel={headingLevel} />
      <ol aria-label={`Kapitel ${unit.nr}: ${unit.title}`} className="flex flex-col gap-6 pb-12 pt-9">
        {nodes.map((node) => {
          const anchor = nodeAnchor(node.id);
          return (
            <PathNode
              key={node.id}
              anchorId={anchor}
              offset={node.offset}
              ariaLabel={node.ariaLabel}
              current={node.state === 'current'}
              open={openId === anchor}
              onToggle={() => toggle(anchor)}
              popover={nodePopover(node, { stepsTotal: unit.stepsTotal, unitNr: unit.nr, xp: stepXp })}
              face={<StepFace node={node} percent={percent} />}
              companion={node.state === 'current' ? companion : null}
            />
          );
        })}
        {finish && (
          <PathNode
            anchorId={nodeAnchor(finish.id)}
            offset={finish.offset}
            ariaLabel={finish.ariaLabel}
            current
            open={openId === nodeAnchor(finish.id)}
            onToggle={() => toggle(nodeAnchor(finish.id))}
            popover={finish.popover}
            face={<StepFace node={finish} percent={100} />}
            companion={companion}
          />
        )}
      </ol>
    </div>
  );
}

function Divider({ id, label, visible }) {
  if (!visible) return <h2 id={id} className="sr-only">{label}</h2>;
  return (
    <h2 id={id} className="flex items-center gap-3 pb-2 pt-6 text-[0.8125rem] font-black uppercase tracking-[0.08em] text-game-muted">
      <span className="h-0.5 min-w-6 flex-1 rounded-full bg-game-line" aria-hidden="true" />
      <span className="text-center">{label}</span>
      <span className="h-0.5 min-w-6 flex-1 rounded-full bg-game-line" aria-hidden="true" />
    </h2>
  );
}

export default function PathSection({ path, stepXp, withCast = false, onJump, lifted = false, anchor = null }) {
  const [openId, setOpenId] = useState(null);
  const toggle = useCallback((id) => setOpenId((prev) => (prev === id ? null : id)), []);

  // One popover at a time: a tap outside the open node closes it, Escape closes it and
  // hands focus back to its node; an opened popover scrolls into view above the tab bar.
  useEffect(() => {
    if (!openId) return undefined;
    const onPointer = (e) => {
      const row = e.target && e.target.closest ? e.target.closest('[data-node-row]') : null;
      if (!row || row.getAttribute('data-node-row') !== openId) setOpenId(null);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpenId(null);
      const btn = document.getElementById(openId);
      if (btn) btn.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    // (measured by hand: a smooth scrollIntoView({ block: 'nearest' }) does not move in Chrome)
    const raf = window.requestAnimationFrame(() => {
      const pop = document.getElementById(`${openId}-popover`);
      if (!pop) return;
      const bar = document.querySelector('[data-tab-bar]');
      const floor = (bar ? bar.getBoundingClientRect().top : window.innerHeight) - 16;
      const over = pop.getBoundingClientRect().bottom - floor;
      if (over <= 0) return;
      let reduce = false;
      try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduce = false; }
      window.scrollBy({ top: over, behavior: reduce ? 'auto' : 'smooth' });
    });
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(raf);
    };
  }, [openId]);

  if (!path) return null;
  // Priya keeps the learner company beside the current node — decorative, and only on
  // the A1 levels, whose cast she is
  const companion = withCast ? <CastAvatar name="Priya" size={72} decorative /> : null;
  return (
    <div id="lernpfad" className="mx-auto max-w-xl px-4 pb-8">
      {/* the way back to the current step; hidden while a popover is open (it would cover it) */}
      {!openId && <JumpButton anchor={anchor} onJump={onJump} lifted={lifted} />}
      {path.sections.map((section, si) => {
        const key = section.nr ?? 'rest';
        const stop = section.stop;
        const stopAnchor = stop ? nodeAnchor(stop.id) : null;
        return (
          <section key={key} aria-labelledby={`dm-modul-${key}`}>
            <Divider id={`dm-modul-${key}`} label={section.dividerLabel} visible={si > 0} />
            {section.units.map((unit) => (
              <UnitBlock
                key={unit.id}
                unit={unit}
                current={path.current}
                stepXp={stepXp}
                openId={openId}
                toggle={toggle}
                headingLevel={3}
                companion={companion}
              />
            ))}
            {stop && (
              <ol aria-label={stop.label} className="pb-10">
                <PathNode
                  anchorId={stopAnchor}
                  offset={0}
                  ariaLabel={stop.ariaLabel}
                  current={stop.state === 'current'}
                  bubbleTone="xp"
                  open={openId === stopAnchor}
                  onToggle={() => toggle(stopAnchor)}
                  popover={stopPopover(stop)}
                  face={<StopFace stop={stop} />}
                  companion={stop.state === 'current' ? companion : null}
                />
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}

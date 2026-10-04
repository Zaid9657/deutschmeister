// Course v2 — „Das kann ich": which can-do a Check shows as proven (SCHEMA §8 Check.proofs).
//
// A Check.proofs entry names what proves its can-do: a proof `item` (answered right in the
// Check), an `aufgabe` (the unit's sprechen/schreiben Aufgabe submitted) and/or a
// `microOutput` (the learner's own micro-output sent). An entry may name more than one — the
// a1.1 units pair a proof item with an Aufgabe, the receptive and the productive side of one
// can-do (final code pass 2026-09-28: CheckView used to read the item first and ignore the
// Aufgabe). The can-do is shown when EVERY named proof is; each is listed with its own status.
// Pure: no React, no I/O.

/** The proof kinds in the order the Check lists them. */
export const PROOF_KINDS = Object.freeze(['item', 'aufgabe', 'microOutput']);

/**
 * The named proofs of one Check.proofs entry with their status:
 * [{ kind: 'item'|'aufgabe'|'microOutput', ref, ok }].
 *   evidence.items         { [proofItemId]: answeredRight }   (the Check's proof phase)
 *   evidence.aufgaben      { sprechen: bool, schreiben: bool } (submitted Aufgaben)
 *   evidence.microOutputs  { [microOutputId]: sent }
 * An item not answered yet is open, like one answered wrong.
 */
export function proofParts(proof, evidence = {}) {
  if (!proof || typeof proof !== 'object') return [];
  const items = evidence.items || {};
  const aufgaben = evidence.aufgaben || {};
  const micro = evidence.microOutputs || {};
  const out = [];
  if (proof.item) out.push({ kind: 'item', ref: String(proof.item), ok: items[proof.item] === true });
  if (proof.aufgabe) out.push({ kind: 'aufgabe', ref: String(proof.aufgabe), ok: Boolean(aufgaben[proof.aufgabe]) });
  if (proof.microOutput) out.push({ kind: 'microOutput', ref: String(proof.microOutput), ok: Boolean(micro[proof.microOutput]) });
  return out;
}

/** Is the entry's can-do shown? Every named proof is; an entry that names none never is. */
export function proofShown(proof, evidence = {}) {
  const parts = proofParts(proof, evidence);
  return parts.length > 0 && parts.every((p) => p.ok);
}

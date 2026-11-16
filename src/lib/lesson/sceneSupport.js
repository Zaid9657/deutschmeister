/** Only numeric line ids and true flags survive storage; never translation or learner text. */
export function packSceneTranslations(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([key, opened]) => /^\d+$/.test(key) && opened === true));
}

export function sceneSupport(chunk, opened = {}) {
  const translationOpened = chunk.lines.some((line) => opened[line.index] === true);
  return { translationOpened, translationShown: chunk.translationDefault === true || translationOpened };
}

export function sceneSupportSummary(attempts = []) {
  const answered = attempts.filter((a) => a.stage === 'scene' && typeof a.translationShown === 'boolean');
  return { unaided: answered.filter((a) => !a.translationShown).length, supported: answered.filter((a) => a.translationShown).length };
}

/** The existing text column carries fixed evidence labels; no schema change or answer text. */
export function sceneAttemptTag(attempt) {
  if (attempt.stage !== 'scene' || typeof attempt.translationShown !== 'boolean') return attempt.errorTag || null;
  return `scene:${attempt.translationShown ? 'translation' : 'unaided'}:${attempt.translationOpened ? 'opened' : 'default'}${attempt.correct ? '' : ':wrong'}`;
}

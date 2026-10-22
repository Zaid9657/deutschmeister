export function createExamAutosave(save, { setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer = null;
  let pending = null;
  const cancel = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    pending = null;
  };
  const flush = () => {
    const snapshot = pending;
    cancel();
    if (!snapshot) return Promise.resolve();
    return Promise.resolve().then(() => save(...snapshot)).catch(error => {
      console.error('[ModelltestRun] autosave:', error?.message);
    });
  };

  return {
    schedule(attemptId, answers) {
      cancel();
      pending = [attemptId, answers];
      timer = setTimer(flush, 1500);
    },
    cancel,
    flush,
  };
}

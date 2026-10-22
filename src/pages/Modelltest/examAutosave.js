export function createExamAutosave(save, { setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer = null;
  const cancel = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  return {
    schedule(attemptId, answers) {
      cancel();
      timer = setTimer(() => {
        timer = null;
        Promise.resolve().then(() => save(attemptId, answers)).catch(error => {
          console.error('[ModelltestRun] autosave:', error?.message);
        });
      }, 1500);
    },
    cancel,
  };
}

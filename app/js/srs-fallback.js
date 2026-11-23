/* Offline preview scheduler. APK build replaces this with the official ts-fsrs adapter. */
(function () {
  const day = 86_400_000;
  const minute = 60_000;
  window.StudyScheduler = {
    kind: 'SM-2 预览调度',
    review(previous, rating, now = new Date()) {
      const history = previous || {};
      const reps = Number(history.reps) || 0;
      const factor = Math.max(1.3, Number(history.factor) || 2.5);
      const priorInterval = Number(history.interval) || 0;
      let nextInterval, nextFactor, nextReps;
      if (rating === 'again') {
        nextInterval = minute;
        nextFactor = Math.max(1.3, factor - .20);
        nextReps = 0;
      } else {
        const quality = rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;
        nextFactor = Math.max(1.3, factor + .1 - (5 - quality) * (.08 + (5 - quality) * .02));
        nextReps = reps + 1;
        if (nextReps === 1) nextInterval = (rating === 'hard' ? .5 : rating === 'easy' ? 3 : 1) * day;
        else if (nextReps === 2) nextInterval = (rating === 'hard' ? 2 : rating === 'easy' ? 9 : 6) * day;
        else nextInterval = Math.max(day, priorInterval * (nextFactor / Math.max(1.3, factor)) * (rating === 'hard' ? 1.2 : rating === 'easy' ? 2.0 : nextFactor));
      }
      return {due:new Date(now.getTime()+nextInterval).toISOString(),interval:nextInterval, factor:nextFactor,reps:nextReps, lastReviewed:now.toISOString(), scheduler:'sm2'};
    }
  };
})();

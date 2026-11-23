import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({request_retention: 0.9, enable_fuzz: false}));
const ratings = {again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy};
function restore(card) {
  const next = {...card};
  if (typeof next.due === 'string') next.due = new Date(next.due);
  if (typeof next.last_review === 'string') next.last_review = new Date(next.last_review);
  return next;
}
window.StudyScheduler = {
  kind:'FSRS',
  review(progress, rating, now = new Date()) {
    const old = progress?.fsrsCard ? restore(progress.fsrsCard) : createEmptyCard(now);
    const scheduled = scheduler.repeat(old, now)[ratings[rating]];
    const card = scheduled.card;
    return {
      due: card.due.toISOString(),
      interval: Math.max(0,card.due.getTime() - now.getTime()),
      reps: (progress?.reps || 0) + 1,
      lastReviewed: now.toISOString(),
      fsrsCard: card,
      scheduler:'fsrs'
    };
  }
};

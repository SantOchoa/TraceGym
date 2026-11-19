import { Attempt, Concept, ConceptStat, SpacedRepetitionCard } from '../types';
import { CONCEPTS_META } from '../data/snippets';

const STORAGE_KEY_ATTEMPTS = 'tracegym_attempts_v1';
const STORAGE_KEY_SPACED = 'tracegym_spaced_v1';
const STORAGE_KEY_STREAK = 'tracegym_streak_v1';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7]; // Day 0, Day 1, Day 3, Day 7

export function getAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading attempts from localStorage', e);
    return [];
  }
}

export function saveAttempt(attempt: Attempt): void {
  const attempts = getAttempts();
  attempts.unshift(attempt);
  try {
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));
  } catch (e) {
    console.error('Error saving attempt to localStorage', e);
  }

  updateSpacedRepetition(attempt);
  updateStreak();
}

export function getSpacedCards(): Record<Concept, SpacedRepetitionCard> {
  const defaultCards: Record<Concept, SpacedRepetitionCard> = {
    recursion: createDefaultCard('recursion'),
    slicing: createDefaultCard('slicing'),
    list_aliasing: createDefaultCard('list_aliasing'),
    scope: createDefaultCard('scope'),
    nested_loops: createDefaultCard('nested_loops'),
    mutable_defaults: createDefaultCard('mutable_defaults')
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPACED);
    if (!raw) return defaultCards;
    const parsed = JSON.parse(raw);
    return { ...defaultCards, ...parsed };
  } catch {
    return defaultCards;
  }
}

function createDefaultCard(concept: Concept): SpacedRepetitionCard {
  return {
    concept,
    level: 0,
    lastPracticed: 0,
    nextReviewDate: Date.now(),
    consecutiveSuccesses: 0
  };
}

function updateSpacedRepetition(attempt: Attempt): void {
  const cards = getSpacedCards();
  const card = cards[attempt.concept] || createDefaultCard(attempt.concept);

  const now = Date.now();
  card.lastPracticed = now;

  if (attempt.isCorrect) {
    // Student succeeded: advance interval (0 -> 1 -> 2 -> 3)
    card.consecutiveSuccesses += 1;
    card.level = Math.min(card.level + 1, REVIEW_INTERVALS_DAYS.length - 1);
    const intervalDays = REVIEW_INTERVALS_DAYS[card.level];
    card.nextReviewDate = now + intervalDays * ONE_DAY_MS;
  } else {
    // Student failed: reset level to 0, must review in 1 day or immediately
    card.consecutiveSuccesses = 0;
    card.level = 0;
    card.nextReviewDate = now; // Due immediately or next session
  }

  cards[attempt.concept] = card;
  try {
    localStorage.setItem(STORAGE_KEY_SPACED, JSON.stringify(cards));
  } catch (e) {
    console.error('Error saving spaced cards', e);
  }
}

function updateStreak(): void {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem(STORAGE_KEY_STREAK);
    let data = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };

    if (data.lastDate !== today) {
      const yesterday = new Date(Date.now() - ONE_DAY_MS).toDateString();
      if (data.lastDate === yesterday) {
        data.streak += 1;
      } else {
        data.streak = 1;
      }
      data.lastDate = today;
      localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error updating streak', e);
  }
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STREAK);
    if (!raw) return 1;
    const data = JSON.parse(raw);
    return data.streak || 1;
  } catch {
    return 1;
  }
}

export function getConceptStats(): ConceptStat[] {
  const attempts = getAttempts();
  const concepts: Concept[] = [
    'recursion',
    'slicing',
    'list_aliasing',
    'scope',
    'nested_loops',
    'mutable_defaults'
  ];

  return concepts.map(concept => {
    const conceptAttempts = attempts.filter(a => a.concept === concept);
    const totalAttempts = conceptAttempts.length;
    const successes = conceptAttempts.filter(a => a.isCorrect).length;
    const accuracyRate = totalAttempts > 0 ? Math.round((successes / totalAttempts) * 100) : 0;
    const lastPracticed = totalAttempts > 0 ? conceptAttempts[0].timestamp : undefined;

    let status: ConceptStat['status'] = 'untested';
    if (totalAttempts > 0) {
      if (accuracyRate < 50) status = 'critical';
      else if (accuracyRate < 80) status = 'warning';
      else status = 'mastered';
    }

    return {
      concept,
      label: CONCEPTS_META[concept].label,
      totalAttempts,
      successes,
      accuracyRate,
      lastPracticed,
      status
    };
  });
}

/**
 * Returns concepts prioritized for review (spaced repetition schedule).
 * Failed concepts re-appear at 1, 3, 7 days.
 */
export function getPrioritizedReviewConcepts(): { concept: Concept; reason: string; isOverdue: boolean }[] {
  const cards = getSpacedCards();
  const stats = getConceptStats();
  const now = Date.now();

  const list: { concept: Concept; reason: string; isOverdue: boolean; priorityScore: number }[] = [];

  for (const stat of stats) {
    const card = cards[stat.concept];
    const isOverdue = card.nextReviewDate <= now;
    const daysSinceLast = card.lastPracticed ? Math.round((now - card.lastPracticed) / ONE_DAY_MS) : 999;

    let reason = 'Listo para evaluar';
    let priorityScore = 0;

    if (stat.totalAttempts === 0) {
      reason = 'Sin intentos previos — concepto por explorar';
      priorityScore = 50;
    } else if (card.level === 0) {
      reason = 'Fallado recientemente — repetición a 1 día activa';
      priorityScore = 100;
    } else if (isOverdue) {
      const interval = REVIEW_INTERVALS_DAYS[card.level] || 1;
      reason = `Repaso espaciado pendiente (ciclo de ${interval} días)`;
      priorityScore = 80 + (daysSinceLast - interval);
    } else {
      const daysLeft = Math.ceil((card.nextReviewDate - now) / ONE_DAY_MS);
      reason = `Consolidado — Próximo repaso en ${daysLeft} día(s)`;
      priorityScore = 20 - card.level;
    }

    list.push({
      concept: stat.concept,
      reason,
      isOverdue: isOverdue || stat.totalAttempts === 0,
      priorityScore
    });
  }

  list.sort((a, b) => b.priorityScore - a.priorityScore);
  return list.map(({ concept, reason, isOverdue }) => ({ concept, reason, isOverdue }));
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
  localStorage.removeItem(STORAGE_KEY_SPACED);
  localStorage.removeItem(STORAGE_KEY_STREAK);
}

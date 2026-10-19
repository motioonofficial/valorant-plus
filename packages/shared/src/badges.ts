// Badges reward activity, never performance (same rule as XP).
import { weekStart } from './training.js';

export interface BadgeInput {
  matches: number;
  customMatches: number;
  trainings: number;
  longestTrainingStreakWeeks: number;
  joinedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  /** Progress toward the badge, e.g. 7 of 10. */
  progress: { current: number; target: number } | null;
}

// Accounts created before this date get the early-supporter badge.
const EARLY_ACCESS_UNTIL = new Date('2027-01-01T00:00:00Z');

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  target: number;
  value: (i: BadgeInput) => number;
}

const COUNTED: readonly BadgeDef[] = [
  { id: 'first-custom', name: 'İlk özel oyun', description: 'İlk özel oyununu oyna', target: 1, value: (i) => i.customMatches },
  { id: 'matches-50', name: '50 maç', description: '50 maç oyna', target: 50, value: (i) => i.matches },
  { id: 'trainings-10', name: '10 antrenman', description: '10 antrenman bitir', target: 10, value: (i) => i.trainings },
  { id: 'trainings-50', name: '50 antrenman', description: '50 antrenman bitir', target: 50, value: (i) => i.trainings },
  { id: 'streak-3', name: 'Seri 3', description: '3 hafta üst üste antrenman yap', target: 3, value: (i) => i.longestTrainingStreakWeeks },
];

export function computeBadges(input: BadgeInput): Badge[] {
  const counted = COUNTED.map((d): Badge => {
    const current = Math.min(d.value(input), d.target);
    return { id: d.id, name: d.name, description: d.description, earned: current >= d.target, progress: { current, target: d.target } };
  });
  const early: Badge = {
    id: 'early',
    name: 'Erken katılım',
    description: 'Beta döneminde katıldın',
    earned: input.joinedAt < EARLY_ACCESS_UNTIL,
    progress: null,
  };
  return [...counted, early];
}

/** Longest run of consecutive weeks (Monday–Sunday) containing at least one of `days` (YYYY-MM-DD). */
export function longestWeeklyStreak(days: string[]): number {
  const weeks = [...new Set(days.map(weekStart))].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    const t = new Date(`${w}T00:00:00Z`).getTime();
    run = prev != null && t - prev === 7 * 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

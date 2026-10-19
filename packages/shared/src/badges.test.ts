import { describe, expect, it } from 'vitest';
import { computeBadges, longestWeeklyStreak } from './badges.js';

const base = { matches: 0, customMatches: 0, trainings: 0, longestTrainingStreakWeeks: 0, joinedAt: new Date('2026-10-19') };

describe('computeBadges', () => {
  it('reports progress toward counted badges, capped at the target', () => {
    const badges = computeBadges({ ...base, trainings: 7, matches: 120 });
    expect(badges.find((b) => b.id === 'trainings-10')).toMatchObject({ earned: false, progress: { current: 7, target: 10 } });
    expect(badges.find((b) => b.id === 'matches-50')).toMatchObject({ earned: true, progress: { current: 50, target: 50 } });
  });

  it('gives the early badge only to accounts created during the beta', () => {
    expect(computeBadges(base).find((b) => b.id === 'early')!.earned).toBe(true);
    expect(computeBadges({ ...base, joinedAt: new Date('2027-03-01') }).find((b) => b.id === 'early')!.earned).toBe(false);
  });
});

describe('longestWeeklyStreak', () => {
  it('counts consecutive weeks, not days', () => {
    // Oct 19–25 is one week; Oct 26 starts the next; Nov 2 the third
    expect(longestWeeklyStreak(['2026-10-19', '2026-10-25', '2026-10-27', '2026-11-03'])).toBe(3);
  });

  it('breaks the streak on a skipped week', () => {
    expect(longestWeeklyStreak(['2026-10-19', '2026-11-02', '2026-11-09'])).toBe(2);
  });

  it('is zero without any training', () => {
    expect(longestWeeklyStreak([])).toBe(0);
  });
});

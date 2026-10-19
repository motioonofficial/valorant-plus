import { describe, expect, it } from 'vitest';
import { DRILLS, analyzeWeakPoints, istanbulDay, recommendDrills, weekStart } from './training.js';

describe('analyzeWeakPoints', () => {
  it('orders metrics by how far they are from the target', () => {
    const points = analyzeWeakPoints({ headshotPct: 0.2, openingDuelWinRate: 0.3, abilitiesPerRound: 2.5 });
    expect(points.map((p) => p.key)).toEqual(['openingDuel', 'headshot', 'abilities']);
    expect(points[0]!.severity).toBeCloseTo(0.4);
    expect(points[1]!.severity).toBeCloseTo(0.2);
  });

  it('gives zero severity when a target is met', () => {
    const [point] = analyzeWeakPoints({ headshotPct: 0.3, openingDuelWinRate: null, abilitiesPerRound: null });
    expect(point).toMatchObject({ key: 'headshot', severity: 0 });
  });

  it('skips metrics without data', () => {
    expect(analyzeWeakPoints({ headshotPct: null, openingDuelWinRate: null, abilitiesPerRound: null })).toEqual([]);
  });
});

describe('recommendDrills', () => {
  it('puts drills for the worst weakness first', () => {
    const points = analyzeWeakPoints({ headshotPct: 0.24, openingDuelWinRate: 0.2, abilitiesPerRound: 2.2 });
    const drills = recommendDrills(points);
    expect(drills[0]!.metric).toBe('openingDuel');
    expect(drills.at(-1)!.metric).not.toBe('openingDuel');
    expect(drills).toHaveLength(DRILLS.length);
  });

  it('keeps catalog order when nothing needs work', () => {
    const points = analyzeWeakPoints({ headshotPct: 0.5, openingDuelWinRate: 0.7, abilitiesPerRound: 3 });
    expect(recommendDrills(points).map((d) => d.id)).toEqual(DRILLS.map((d) => d.id));
  });
});

describe('istanbulDay', () => {
  it('uses Istanbul time (UTC+3), not UTC', () => {
    // 22:30 UTC on Oct 19 is already Oct 20 in Istanbul
    expect(istanbulDay(new Date('2026-10-19T22:30:00Z'))).toBe('2026-10-20');
    expect(istanbulDay(new Date('2026-10-19T20:30:00Z'))).toBe('2026-10-19');
  });
});

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(weekStart('2026-10-19')).toBe('2026-10-19'); // Monday
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // Sunday
    expect(weekStart('2026-10-20')).toBe('2026-10-19');
  });
});

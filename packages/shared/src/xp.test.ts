import { describe, expect, it } from 'vitest';
import { levelFromTotalXp, xpForLevel } from './xp.js';

describe('xpForLevel', () => {
  it('grows by 150 per level', () => {
    expect(xpForLevel(1)).toBe(1000);
    expect(xpForLevel(2)).toBe(1150);
    expect(xpForLevel(14)).toBe(2950);
  });

  it('rejects invalid levels', () => {
    expect(() => xpForLevel(0)).toThrow(RangeError);
    expect(() => xpForLevel(1.5)).toThrow(RangeError);
  });
});

describe('levelFromTotalXp', () => {
  it('starts at level 1', () => {
    expect(levelFromTotalXp(0)).toEqual({ level: 1, current: 0, needed: 1000 });
  });

  it('rolls over exactly at the threshold', () => {
    expect(levelFromTotalXp(1000)).toEqual({ level: 2, current: 0, needed: 1150 });
    expect(levelFromTotalXp(999)).toEqual({ level: 1, current: 999, needed: 1000 });
  });

  it('accumulates across several levels', () => {
    // 1000 + 1150 + 1300 = 3450 → level 4 with 50 left over
    expect(levelFromTotalXp(3500)).toEqual({ level: 4, current: 50, needed: 1450 });
  });

  it('rejects negative xp', () => {
    expect(() => levelFromTotalXp(-1)).toThrow(RangeError);
  });
});

import { describe, expect, it } from 'vitest';
import { competitiveTierName } from './ranks.js';

describe('competitiveTierName', () => {
  it.each([
    [null, 'Derecesiz'],
    [0, 'Derecesiz'],
    [3, 'Demir 1'],
    [5, 'Demir 3'],
    [12, 'Altın 1'],
    [13, 'Altın 2'],
    [15, 'Platin 1'],
    [26, 'Ölümsüzlük 3'],
    [27, 'Radyant'],
  ])('tier %s → %s', (tier, name) => {
    expect(competitiveTierName(tier)).toBe(name);
  });
});

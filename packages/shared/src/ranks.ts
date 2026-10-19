// Official VALORANT competitive tiers as numbered in match data (0 = unranked, 27 = Radiant).
// Tiers 1–2 are unused.
const DIVISIONS = ['Demir', 'Bronz', 'Gümüş', 'Altın', 'Platin', 'Elmas', 'Yücelik', 'Ölümsüzlük'] as const;

export function competitiveTierName(tier: number | null | undefined): string {
  if (tier == null || tier < 3) return 'Derecesiz';
  if (tier >= 27) return 'Radyant';
  const division = DIVISIONS[Math.floor((tier - 3) / 3)];
  if (!division) return 'Derecesiz';
  return `${division} ${((tier - 3) % 3) + 1}`;
}

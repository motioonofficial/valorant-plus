import type { StatsSummary } from '@drill/shared';
import { prisma } from '../db.js';

const RECENT_LIMIT = 20;

function ratio(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

export async function getStatsSummary(puuid: string): Promise<StatsSummary> {
  const rows = await prisma.matchPlayer.findMany({
    where: { puuid },
    include: { match: true },
    orderBy: { match: { startedAt: 'desc' } },
    take: RECENT_LIMIT,
  });

  let kills = 0, deaths = 0, head = 0, shots = 0, damage = 0, rounds = 0, wins = 0;
  for (const r of rows) {
    kills += r.kills;
    deaths += r.deaths;
    head += r.headshots;
    shots += r.headshots + r.bodyshots + r.legshots;
    damage += r.damage;
    rounds += r.match.roundCount;
    if (r.won) wins += 1;
  }

  const latestCompetitive = rows.find((r) => r.match.queueId === 'competitive');

  return {
    matches: rows.length,
    wins,
    losses: rows.length - wins,
    kd: ratio(kills, deaths),
    headshotPct: ratio(head, shots),
    adr: ratio(damage, rounds),
    competitiveTier: latestCompetitive?.competitiveTier ?? null,
  };
}

/** Official tier for display to *other* players: only when the player opted in. */
export async function getSharedTier(user: { puuid: string; dataSharing: boolean }): Promise<number | null> {
  if (!user.dataSharing) return null;
  const row = await prisma.matchPlayer.findFirst({
    where: { puuid: user.puuid, match: { queueId: 'competitive' } },
    orderBy: { match: { startedAt: 'desc' } },
    select: { competitiveTier: true },
  });
  return row?.competitiveTier ?? null;
}

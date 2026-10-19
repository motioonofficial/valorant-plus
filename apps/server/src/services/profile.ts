import { computeBadges, longestWeeklyStreak, type AgentStat, type MapStat, type ProfileResponse, type XpHistoryItem } from '@drill/shared';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';

const PROFILE_MATCHES = 200;
const XP_HISTORY = 10;

interface Row {
  agentId: string;
  mapId: string;
  won: boolean;
  kills: number;
  deaths: number;
}

/** Per-agent and per-map totals, most played first. Pure, so it's unit-tested. */
export function aggregateAgentsAndMaps(rows: Row[]): { agents: AgentStat[]; maps: MapStat[] } {
  const agents = new Map<string, { games: number; wins: number; kills: number; deaths: number }>();
  const maps = new Map<string, { games: number; wins: number }>();

  for (const r of rows) {
    const agentId = r.agentId.toLowerCase();
    const a = agents.get(agentId) ?? { games: 0, wins: 0, kills: 0, deaths: 0 };
    a.games += 1;
    a.wins += r.won ? 1 : 0;
    a.kills += r.kills;
    a.deaths += r.deaths;
    agents.set(agentId, a);

    const m = maps.get(r.mapId) ?? { games: 0, wins: 0 };
    m.games += 1;
    m.wins += r.won ? 1 : 0;
    maps.set(r.mapId, m);
  }

  return {
    agents: [...agents.entries()]
      .map(([agentId, a]) => ({ agentId, games: a.games, wins: a.wins, kd: a.deaths === 0 ? null : a.kills / a.deaths }))
      .sort((x, y) => y.games - x.games),
    maps: [...maps.entries()].map(([mapId, m]) => ({ mapId, ...m })).sort((x, y) => y.games - x.games),
  };
}

async function xpHistory(userId: string): Promise<XpHistoryItem[]> {
  const events = await prisma.xpEvent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: XP_HISTORY });

  // sourceKey formats: "match:<matchId>" and "training:<YYYY-MM-DD>:<drillId>"
  const matchIds = events.filter((e) => e.sourceKey.startsWith('match:')).map((e) => e.sourceKey.slice('match:'.length));
  const matches = await prisma.match.findMany({ where: { matchId: { in: matchIds } }, select: { matchId: true, mapId: true } });
  const mapByMatch = new Map(matches.map((m) => [m.matchId, m.mapId]));

  return events.map((e) => ({
    type: e.type,
    amount: e.amount,
    createdAt: e.createdAt.toISOString(),
    mapId: e.sourceKey.startsWith('match:') ? (mapByMatch.get(e.sourceKey.slice('match:'.length)) ?? null) : null,
    drillId: e.sourceKey.startsWith('training:') ? (e.sourceKey.split(':')[2] ?? null) : null,
  }));
}

export async function getProfile(user: User): Promise<ProfileResponse> {
  const [rows, trainingDays, history] = await Promise.all([
    prisma.matchPlayer.findMany({
      where: { puuid: user.puuid },
      include: { match: { select: { mapId: true, queueId: true, startedAt: true } } },
      orderBy: { match: { startedAt: 'desc' } },
      take: PROFILE_MATCHES,
    }),
    prisma.trainingCompletion.findMany({ where: { userId: user.id }, select: { day: true } }),
    xpHistory(user.id),
  ]);

  const competitive = rows.filter((r) => r.match.queueId === 'competitive');
  const totals = {
    matches: rows.length,
    customMatches: rows.filter((r) => r.match.queueId === '').length,
    trainings: trainingDays.length,
    longestStreakWeeks: longestWeeklyStreak(trainingDays.map((t) => t.day)),
  };

  return {
    totals,
    currentTier: competitive[0]?.competitiveTier ?? null,
    peakTier: competitive.length > 0 ? Math.max(...competitive.map((r) => r.competitiveTier)) : null,
    badges: computeBadges({
      matches: totals.matches,
      customMatches: totals.customMatches,
      trainings: totals.trainings,
      longestTrainingStreakWeeks: totals.longestStreakWeeks,
      joinedAt: user.createdAt,
    }),
    ...aggregateAgentsAndMaps(rows.map((r) => ({ agentId: r.agentId, mapId: r.match.mapId, won: r.won, kills: r.kills, deaths: r.deaths }))),
    xpHistory: history,
    settings: { dataSharing: user.dataSharing, publicProfile: user.publicProfile },
  };
}

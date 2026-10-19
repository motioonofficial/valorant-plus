import {
  MAX_REWARDED_TRAININGS_PER_DAY,
  analyzeWeakPoints,
  findDrill,
  istanbulDay,
  recommendDrills,
  weekStart,
  type CompleteTrainingResponse,
  type PlayerMetrics,
  type TrainingResponse,
} from '@drill/shared';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { awardXp } from './xp.js';

const RECENT_MATCHES = 20;
const TREND_MATCHES = 10;

function ratio(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

async function recentMetrics(puuid: string): Promise<{ metrics: PlayerMetrics; headshotTrend: number[] }> {
  const rows = await prisma.matchPlayer.findMany({
    where: { puuid },
    include: { match: { select: { roundCount: true, startedAt: true } } },
    orderBy: { match: { startedAt: 'desc' } },
    take: RECENT_MATCHES,
  });

  let head = 0, hits = 0, firstKills = 0, firstDeaths = 0, casts = 0, rounds = 0;
  for (const r of rows) {
    head += r.headshots;
    hits += r.headshots + r.bodyshots + r.legshots;
    firstKills += r.firstKills;
    firstDeaths += r.firstDeaths;
    casts += r.abilityCasts;
    rounds += r.match.roundCount;
  }

  const headshotTrend = rows
    .slice(0, TREND_MATCHES)
    .reverse()
    .map((r) => ratio(r.headshots, r.headshots + r.bodyshots + r.legshots))
    .filter((v): v is number => v != null);

  return {
    metrics: {
      headshotPct: ratio(head, hits),
      openingDuelWinRate: ratio(firstKills, firstKills + firstDeaths),
      abilitiesPerRound: ratio(casts, rounds),
    },
    headshotTrend,
  };
}

export async function getTraining(user: User, now = new Date()): Promise<TrainingResponse> {
  const today = istanbulDay(now);
  const monday = weekStart(today);

  const [{ metrics, headshotTrend }, weekCompletions, weekXp] = await Promise.all([
    recentMetrics(user.puuid),
    prisma.trainingCompletion.findMany({ where: { userId: user.id, day: { gte: monday } }, select: { drillId: true, day: true } }),
    prisma.xpEvent.aggregate({
      where: { userId: user.id, type: 'TRAINING_COMPLETED', sourceKey: { gte: `training:${monday}` } },
      _sum: { amount: true },
    }),
  ]);

  const weakPoints = analyzeWeakPoints(metrics);
  const doneToday = new Set(weekCompletions.filter((c) => c.day === today).map((c) => c.drillId));
  const rewardedToday = await prisma.xpEvent.count({
    where: { userId: user.id, type: 'TRAINING_COMPLETED', sourceKey: { startsWith: `training:${today}:` } },
  });

  return {
    focus: weakPoints[0] && weakPoints[0].severity > 0 ? weakPoints[0].key : null,
    weakPoints,
    drills: recommendDrills(weakPoints).map((d) => ({ ...d, completedToday: doneToday.has(d.id) })),
    week: { activeDays: new Set(weekCompletions.map((c) => c.day)).size, xp: weekXp._sum.amount ?? 0 },
    today: { rewarded: rewardedToday, maxRewarded: MAX_REWARDED_TRAININGS_PER_DAY },
    headshotTrend,
  };
}

export class UnknownDrillError extends Error {}

/**
 * Records a self-reported completion. Each drill counts once per day, and only the first
 * few completions of a day pay XP, so ticking boxes can't be farmed for levels.
 */
export async function completeTraining(user: User, drillId: string, now = new Date()): Promise<CompleteTrainingResponse> {
  const drill = findDrill(drillId);
  if (!drill) throw new UnknownDrillError(drillId);

  const day = istanbulDay(now);
  const created = await prisma.trainingCompletion.createMany({
    data: [{ userId: user.id, drillId, day, completedAt: now }],
    skipDuplicates: true,
  });
  if (created.count === 0) return { xpAwarded: 0, alreadyDone: true };

  const rewardedToday = await prisma.xpEvent.count({
    where: { userId: user.id, type: 'TRAINING_COMPLETED', sourceKey: { startsWith: `training:${day}:` } },
  });
  if (rewardedToday >= MAX_REWARDED_TRAININGS_PER_DAY) return { xpAwarded: 0, alreadyDone: false };

  // The day leads the key so a week's training XP can be summed with a range query.
  const awarded = await awardXp(user.id, 'TRAINING_COMPLETED', `training:${day}:${drillId}`, drill.xp);
  return { xpAwarded: awarded ? drill.xp : 0, alreadyDone: false };
}

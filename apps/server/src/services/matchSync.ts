import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { toShard, type RiotClient } from '../riot/client.js';
import { mapRiotMatch } from './matchMapper.js';
import { awardXp } from './xp.js';

const SYNC_LIMIT = 20;

/**
 * Pulls the user's latest matches from Riot, stores the ones we don't have yet and
 * awards activity XP. Only matches played after the account was linked earn XP,
 * so linking an old account doesn't dump years of XP at once.
 */
export async function syncUserMatches(riot: RiotClient, user: User): Promise<{ newMatches: number; xpAwarded: number }> {
  const shard = toShard(user.shard);
  const list = await riot.getMatchlist(shard, user.puuid);
  const recent = list.history.slice(0, SYNC_LIMIT);

  const known = await prisma.match.findMany({
    where: { matchId: { in: recent.map((m) => m.matchId) } },
    select: { matchId: true },
  });
  const knownIds = new Set(known.map((m) => m.matchId));

  let newMatches = 0;
  for (const entry of recent) {
    if (knownIds.has(entry.matchId)) continue;
    const riotMatch = await riot.getMatch(shard, entry.matchId);
    if (!riotMatch.matchInfo.isCompleted) continue;

    const { match, players } = mapRiotMatch(riotMatch);
    await prisma.$transaction([
      prisma.match.create({ data: match }),
      prisma.matchPlayer.createMany({ data: players, skipDuplicates: true }),
    ]);
    newMatches += 1;
  }

  let xpAwarded = 0;
  for (const entry of recent) {
    if (entry.gameStartTimeMillis < user.createdAt.getTime()) continue;
    if (await awardXp(user.id, 'MATCH_COMPLETED', `match:${entry.matchId}`)) xpAwarded += 1;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastSyncedAt: new Date() } });
  return { newMatches, xpAwarded };
}

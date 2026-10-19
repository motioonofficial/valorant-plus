import { queueIdForFilter, type MatchDetail, type MatchListResponse, type QueueFilter, type RecentMatch, type ScoreboardRow } from '@drill/shared';
import type { Match, MatchPlayer } from '@prisma/client';
import { prisma } from '../db.js';

const PAGE_SIZE = 20;

function ratio(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

const acs = (score: number, rounds: number) => (rounds === 0 ? 0 : Math.round(score / rounds));
const headshotPct = (p: MatchPlayer) => ratio(p.headshots, p.headshots + p.bodyshots + p.legshots);

function toRecentMatch(p: MatchPlayer & { match: Match }): RecentMatch {
  return {
    matchId: p.matchId,
    mapId: p.match.mapId,
    queueId: p.match.queueId,
    startedAt: p.match.startedAt.toISOString(),
    agentId: p.agentId,
    won: p.won,
    roundsWon: p.roundsWon,
    roundsLost: p.roundsLost,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    acs: acs(p.score, p.match.roundCount),
    headshotPct: headshotPct(p),
  };
}

export async function listMatches(
  puuid: string,
  opts: { queue?: QueueFilter; cursor?: string; limit?: number } = {},
): Promise<MatchListResponse> {
  const limit = opts.limit ?? PAGE_SIZE;
  const queueId = queueIdForFilter(opts.queue ?? 'all');

  const rows = await prisma.matchPlayer.findMany({
    where: {
      puuid,
      match: {
        ...(queueId != null ? { queueId } : {}),
        ...(opts.cursor ? { startedAt: { lt: new Date(opts.cursor) } } : {}),
      },
    },
    include: { match: true },
    orderBy: { match: { startedAt: 'desc' } },
    take: limit + 1,
  });

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  return {
    items: page.map(toRecentMatch),
    nextCursor: hasMore && page.length > 0 ? page.at(-1)!.match.startedAt.toISOString() : null,
  };
}

/**
 * Builds the scoreboard the viewer sees. Privacy rules (Riot policy):
 * - names only for the viewer and for players who opted in to sharing;
 * - other players' PUUIDs never leave the server, so they can't be looked up elsewhere.
 * Pure, so the rules are unit-tested.
 */
export function buildMatchDetail(
  viewerPuuid: string,
  match: Match,
  players: MatchPlayer[],
  sharedNames: ReadonlyMap<string, string>,
): MatchDetail | null {
  const me = players.find((p) => p.puuid === viewerPuuid);
  if (!me) return null;

  const row = (p: MatchPlayer): ScoreboardRow => ({
    isMe: p.puuid === viewerPuuid,
    name: p.puuid === viewerPuuid ? null : (sharedNames.get(p.puuid) ?? null),
    agentId: p.agentId,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    acs: acs(p.score, match.roundCount),
  });

  const teamIds = [...new Set(players.map((p) => p.teamId))].sort((a, b) =>
    a === me.teamId ? -1 : b === me.teamId ? 1 : a.localeCompare(b),
  );

  return {
    matchId: match.matchId,
    mapId: match.mapId,
    queueId: match.queueId,
    startedAt: match.startedAt.toISOString(),
    gameLengthMs: match.gameLengthMs,
    won: me.won,
    rounds: match.roundWinners.map((w) => (w === me.teamId ? 'win' : 'loss')),
    me: {
      agentId: me.agentId,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      acs: acs(me.score, match.roundCount),
      adr: match.roundCount === 0 ? null : me.damage / match.roundCount,
      headshotPct: headshotPct(me),
      firstKills: me.firstKills,
    },
    teams: teamIds.map((teamId) => {
      const members = players.filter((p) => p.teamId === teamId).sort((a, b) => b.score - a.score);
      return {
        mine: teamId === me.teamId,
        roundsWon: members[0]?.roundsWon ?? 0,
        players: members.map(row),
      };
    }),
  };
}

/** Returns null unless the viewer played in the match. */
export async function getMatchDetail(viewerPuuid: string, matchId: string): Promise<MatchDetail | null> {
  const match = await prisma.match.findUnique({ where: { matchId }, include: { players: true } });
  if (!match) return null;

  const others = match.players.map((p) => p.puuid).filter((id) => id !== viewerPuuid);
  const sharing = await prisma.user.findMany({
    where: { puuid: { in: others }, dataSharing: true, publicProfile: true },
    select: { puuid: true, gameName: true, tagLine: true },
  });
  const sharedNames = new Map(sharing.map((u) => [u.puuid, `${u.gameName}#${u.tagLine}`]));

  return buildMatchDetail(viewerPuuid, match, match.players, sharedNames);
}

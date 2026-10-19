import type { RiotMatch } from '../riot/types.js';

export interface MatchRow {
  matchId: string;
  mapId: string;
  queueId: string;
  startedAt: Date;
  roundCount: number;
}

export interface MatchPlayerRow {
  matchId: string;
  puuid: string;
  teamId: string;
  agentId: string;
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  damage: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  competitiveTier: number;
}

/** Flattens a Riot match into the rows DRILL stores. Pure, so it can be unit-tested. */
export function mapRiotMatch(match: RiotMatch): { match: MatchRow; players: MatchPlayerRow[] } {
  const { matchInfo } = match;
  const roundCount = match.roundResults.length;

  const damageByPuuid = new Map<string, { damage: number; headshots: number; bodyshots: number; legshots: number }>();
  for (const round of match.roundResults) {
    for (const ps of round.playerStats) {
      const acc = damageByPuuid.get(ps.puuid) ?? { damage: 0, headshots: 0, bodyshots: 0, legshots: 0 };
      for (const d of ps.damage) {
        acc.damage += d.damage;
        acc.headshots += d.headshots;
        acc.bodyshots += d.bodyshots;
        acc.legshots += d.legshots;
      }
      damageByPuuid.set(ps.puuid, acc);
    }
  }

  const teams = new Map(match.teams.map((t) => [t.teamId, t]));

  const players = match.players.map((p): MatchPlayerRow => {
    const team = teams.get(p.teamId);
    const roundsWon = team?.roundsWon ?? 0;
    const dmg = damageByPuuid.get(p.puuid) ?? { damage: 0, headshots: 0, bodyshots: 0, legshots: 0 };
    return {
      matchId: matchInfo.matchId,
      puuid: p.puuid,
      teamId: p.teamId,
      agentId: p.characterId,
      won: team?.won ?? false,
      roundsWon,
      roundsLost: Math.max(roundCount - roundsWon, 0),
      kills: p.stats?.kills ?? 0,
      deaths: p.stats?.deaths ?? 0,
      assists: p.stats?.assists ?? 0,
      score: p.stats?.score ?? 0,
      competitiveTier: p.competitiveTier,
      ...dmg,
    };
  });

  return {
    match: {
      matchId: matchInfo.matchId,
      mapId: matchInfo.mapId,
      queueId: matchInfo.queueId,
      startedAt: new Date(matchInfo.gameStartMillis),
      roundCount,
    },
    players,
  };
}

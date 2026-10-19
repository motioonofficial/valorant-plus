import type { Match, MatchPlayer } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildMatchDetail } from './matches.js';

const match: Match = {
  matchId: 'm1',
  mapId: '/Game/Maps/Ascent/Ascent',
  queueId: 'competitive',
  startedAt: new Date('2026-10-19T18:00:00Z'),
  roundCount: 4,
  gameLengthMs: 1_500_000,
  roundWinners: ['Blue', 'Red', 'Red', 'Red'],
};

const player = (puuid: string, agentId: string, teamId: string, score: number, extra: Partial<MatchPlayer> = {}): MatchPlayer => ({
  matchId: 'm1', puuid, teamId, agentId, won: teamId === 'Red', roundsWon: teamId === 'Red' ? 3 : 1,
  roundsLost: teamId === 'Red' ? 1 : 3, kills: 5, deaths: 3, assists: 2, score, damage: 600, headshots: 2, bodyshots: 6,
  legshots: 0, competitiveTier: 12, firstKills: 1, firstDeaths: 0, abilityCasts: 8, ...extra,
});

const players = [
  player('puuid-enemy', 'reyna', 'Blue', 900),
  player('puuid-me', 'jett', 'Red', 800),
  player('puuid-friend', 'omen', 'Red', 1000),
  player('puuid-stranger', 'sova', 'Red', 400),
];

describe('buildMatchDetail', () => {
  it('returns null when the viewer did not play in the match', () => {
    expect(buildMatchDetail('puuid-nobody', match, players, new Map())).toBeNull();
  });

  it("puts the viewer's team first and sorts players by score", () => {
    const detail = buildMatchDetail('puuid-me', match, players, new Map())!;
    expect(detail.teams.map((t) => t.mine)).toEqual([true, false]);
    expect(detail.teams[0]!.players.map((p) => p.agentId)).toEqual(['omen', 'jett', 'sova']);
    expect(detail.teams[0]!.roundsWon).toBe(3);
  });

  it('only names players who opted in, and never exposes PUUIDs', () => {
    const detail = buildMatchDetail('puuid-me', match, players, new Map([['puuid-friend', 'Duvar#4410']]))!;
    const rows = detail.teams.flatMap((t) => t.players);
    expect(rows.find((r) => r.agentId === 'omen')!.name).toBe('Duvar#4410');
    expect(rows.find((r) => r.agentId === 'sova')!.name).toBeNull();
    expect(rows.find((r) => r.agentId === 'reyna')!.name).toBeNull();
    expect(rows.find((r) => r.isMe)!.agentId).toBe('jett');
    expect(JSON.stringify(detail)).not.toContain('puuid-');
  });

  it("describes rounds from the viewer's side", () => {
    expect(buildMatchDetail('puuid-me', match, players, new Map())!.rounds).toEqual(['loss', 'win', 'win', 'win']);
    expect(buildMatchDetail('puuid-enemy', match, players, new Map())!.rounds).toEqual(['win', 'loss', 'loss', 'loss']);
  });

  it("computes the viewer's own stats", () => {
    const { me } = buildMatchDetail('puuid-me', match, players, new Map())!;
    expect(me).toMatchObject({ acs: 200, adr: 150, headshotPct: 0.25, firstKills: 1 });
  });
});

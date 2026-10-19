import { describe, expect, it } from 'vitest';
import type { RiotMatch } from '../riot/types.js';
import { mapRiotMatch } from './matchMapper.js';

const casts = (n: number) => ({ grenadeCasts: n, ability1Casts: n, ability2Casts: n, ultimateCasts: 0 });

const fixture: RiotMatch = {
  matchInfo: { matchId: 'm1', mapId: '/Game/Maps/Ascent/Ascent', queueId: 'competitive', gameStartMillis: 1_700_000_000_000, isCompleted: true },
  players: [
    { puuid: 'me', teamId: 'Red', characterId: 'jett', competitiveTier: 13, stats: { score: 600, roundsPlayed: 3, kills: 4, deaths: 2, assists: 1, abilityCasts: casts(2) } },
    { puuid: 'them', teamId: 'Blue', characterId: 'sova', competitiveTier: 12, stats: { score: 300, roundsPlayed: 3, kills: 2, deaths: 4, assists: 0, abilityCasts: null } },
  ],
  teams: [
    { teamId: 'Red', won: true, roundsPlayed: 3, roundsWon: 2 },
    { teamId: 'Blue', won: false, roundsPlayed: 3, roundsWon: 1 },
  ],
  roundResults: [
    {
      // "me" opens the round, then trades into a later death
      playerStats: [
        { puuid: 'me', kills: [{ timeSinceRoundStartMillis: 12_000, killer: 'me', victim: 'them' }], damage: [{ damage: 150, headshots: 1, bodyshots: 1, legshots: 0 }] },
        { puuid: 'them', kills: [{ timeSinceRoundStartMillis: 30_000, killer: 'them', victim: 'me' }], damage: [] },
      ],
    },
    {
      // the earliest kill is listed under the second player; order must not matter
      playerStats: [
        { puuid: 'me', kills: [{ timeSinceRoundStartMillis: 40_000, killer: 'me', victim: 'them' }], damage: [{ damage: 100, headshots: 0, bodyshots: 2, legshots: 1 }] },
        { puuid: 'them', kills: [{ timeSinceRoundStartMillis: 9_000, killer: 'them', victim: 'me' }], damage: [{ damage: 80, headshots: 0, bodyshots: 2, legshots: 0 }] },
      ],
    },
    { playerStats: [] },
  ],
};

describe('mapRiotMatch', () => {
  it('maps match metadata', () => {
    const { match } = mapRiotMatch(fixture);
    expect(match).toEqual({
      matchId: 'm1',
      mapId: '/Game/Maps/Ascent/Ascent',
      queueId: 'competitive',
      startedAt: new Date(1_700_000_000_000),
      roundCount: 3,
    });
  });

  it('sums damage and shots across rounds per player', () => {
    const me = mapRiotMatch(fixture).players.find((p) => p.puuid === 'me');
    expect(me).toMatchObject({ damage: 250, headshots: 1, bodyshots: 3, legshots: 1 });
  });

  it('derives win/loss and rounds from the player team', () => {
    const [me, them] = mapRiotMatch(fixture).players;
    expect(me).toMatchObject({ won: true, roundsWon: 2, roundsLost: 1, agentId: 'jett' });
    expect(them).toMatchObject({ won: false, roundsWon: 1, roundsLost: 2 });
  });

  it('counts the opening kill and death of each round', () => {
    const [me, them] = mapRiotMatch(fixture).players;
    expect(me).toMatchObject({ firstKills: 1, firstDeaths: 1 });
    expect(them).toMatchObject({ firstKills: 1, firstDeaths: 1 });
  });

  it('ignores rounds without kills when counting openings', () => {
    const quiet: RiotMatch = { ...fixture, roundResults: [{ playerStats: [] }] };
    expect(mapRiotMatch(quiet).players[0]).toMatchObject({ firstKills: 0, firstDeaths: 0 });
  });

  it('sums ability casts and tolerates missing cast data', () => {
    const [me, them] = mapRiotMatch(fixture).players;
    expect(me!.abilityCasts).toBe(6);
    expect(them!.abilityCasts).toBe(0);
  });

  it('tolerates players without stats', () => {
    const noStats: RiotMatch = { ...fixture, players: [{ ...fixture.players[0]!, stats: null }] };
    expect(mapRiotMatch(noStats).players[0]).toMatchObject({ kills: 0, deaths: 0, score: 0, abilityCasts: 0 });
  });
});

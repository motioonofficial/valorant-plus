import { describe, expect, it } from 'vitest';
import type { RiotMatch } from '../riot/types.js';
import { mapRiotMatch } from './matchMapper.js';

const fixture: RiotMatch = {
  matchInfo: { matchId: 'm1', mapId: '/Game/Maps/Ascent/Ascent', queueId: 'competitive', gameStartMillis: 1_700_000_000_000, isCompleted: true },
  players: [
    { puuid: 'me', teamId: 'Red', characterId: 'jett', competitiveTier: 13, stats: { score: 600, roundsPlayed: 3, kills: 4, deaths: 2, assists: 1 } },
    { puuid: 'them', teamId: 'Blue', characterId: 'sova', competitiveTier: 12, stats: { score: 300, roundsPlayed: 3, kills: 2, deaths: 4, assists: 0 } },
  ],
  teams: [
    { teamId: 'Red', won: true, roundsPlayed: 3, roundsWon: 2 },
    { teamId: 'Blue', won: false, roundsPlayed: 3, roundsWon: 1 },
  ],
  roundResults: [
    { playerStats: [{ puuid: 'me', damage: [{ damage: 150, headshots: 1, bodyshots: 1, legshots: 0 }] }] },
    { playerStats: [{ puuid: 'me', damage: [{ damage: 100, headshots: 0, bodyshots: 2, legshots: 1 }] }, { puuid: 'them', damage: [{ damage: 80, headshots: 0, bodyshots: 2, legshots: 0 }] }] },
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

  it('tolerates players without stats', () => {
    const noStats: RiotMatch = { ...fixture, players: [{ ...fixture.players[0]!, stats: null }] };
    expect(mapRiotMatch(noStats).players[0]).toMatchObject({ kills: 0, deaths: 0, score: 0 });
  });
});

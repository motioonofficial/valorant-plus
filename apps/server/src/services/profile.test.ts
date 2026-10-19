import { describe, expect, it } from 'vitest';
import { aggregateAgentsAndMaps } from './profile.js';

const row = (agentId: string, mapId: string, won: boolean, kills = 10, deaths = 10) => ({ agentId, mapId, won, kills, deaths });

describe('aggregateAgentsAndMaps', () => {
  it('groups by agent and map, most played first', () => {
    const { agents, maps } = aggregateAgentsAndMaps([
      row('sova', 'ascent', true),
      row('jett', 'bind', false),
      row('jett', 'ascent', true),
      row('jett', 'ascent', false),
    ]);
    expect(agents.map((a) => [a.agentId, a.games, a.wins])).toEqual([['jett', 3, 1], ['sova', 1, 1]]);
    expect(maps.map((m) => [m.mapId, m.games, m.wins])).toEqual([['ascent', 3, 2], ['bind', 1, 0]]);
  });

  it('computes K/D per agent and handles zero deaths', () => {
    const { agents } = aggregateAgentsAndMaps([row('jett', 'a', true, 20, 10), row('jett', 'a', true, 10, 10), row('sage', 'a', true, 5, 0)]);
    expect(agents.find((a) => a.agentId === 'jett')!.kd).toBeCloseTo(1.5);
    expect(agents.find((a) => a.agentId === 'sage')!.kd).toBeNull();
  });

  it('treats agent ids case-insensitively', () => {
    const { agents } = aggregateAgentsAndMaps([row('ABC', 'a', true), row('abc', 'a', false)]);
    expect(agents).toHaveLength(1);
    expect(agents[0]!.games).toBe(2);
  });
});

import type { Shard } from '@drill/shared';
import type { RiotActiveShard, RiotMatch, RiotMatchlist } from './types.js';

const SHARDS: readonly Shard[] = ['eu', 'na', 'ap', 'kr'];

export function toShard(value: string): Shard {
  if ((SHARDS as readonly string[]).includes(value)) return value as Shard;
  throw new Error(`unsupported shard: ${value}`);
}

export class RiotApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`Riot API ${status} for ${url}`);
  }
}

type FetchFn = typeof fetch;

/**
 * Thin wrapper around the official Riot API. The API key stays on the server;
 * it must never be shipped inside the desktop app.
 */
export class RiotClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: FetchFn = fetch,
    private readonly maxRetries = 3,
  ) {}

  getActiveShard(puuid: string): Promise<RiotActiveShard> {
    return this.get(`https://europe.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/${puuid}`);
  }

  getMatchlist(shard: Shard, puuid: string): Promise<RiotMatchlist> {
    return this.get(`https://${shard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`);
  }

  getMatch(shard: Shard, matchId: string): Promise<RiotMatch> {
    return this.get(`https://${shard}.api.riotgames.com/val/match/v1/matches/${matchId}`);
  }

  private async get<T>(url: string, attempt = 0): Promise<T> {
    if (!this.apiKey) throw new Error('RIOT_API_KEY is not set');
    const res = await this.fetchFn(url, { headers: { 'X-Riot-Token': this.apiKey } });

    if (res.status === 429 && attempt < this.maxRetries) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
      await sleep(Math.max(retryAfter, 1) * 1000);
      return this.get<T>(url, attempt + 1);
    }
    if (!res.ok) throw new RiotApiError(res.status, url);
    return (await res.json()) as T;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

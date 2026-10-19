import type { ContentResponse } from '@drill/shared';
import type { FastifyInstance } from 'fastify';

const CACHE_MS = 60 * 60 * 1000;
// Community-run, keyless mirror of game content (names + image URLs). Riot's own Content API
// has names but no images. We only pass URLs through; no Riot art is stored in this repo.
const SOURCE = 'https://valorant-api.com/v1';

interface ApiList<T> {
  data: T[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SOURCE}${path}`);
  if (!res.ok) throw new Error(`valorant-api.com ${res.status} for ${path}`);
  return (await res.json()) as T;
}

export async function fetchContent(): Promise<ContentResponse> {
  const [agents, maps, tiers] = await Promise.all([
    getJson<ApiList<{ uuid: string; displayName: string; displayIcon: string; fullPortrait: string | null }>>(
      '/agents?isPlayableCharacter=true&language=tr-TR',
    ),
    getJson<ApiList<{ displayName: string; mapUrl: string; splash: string | null; listViewIcon: string | null }>>(
      '/maps?language=tr-TR',
    ),
    getJson<ApiList<{ tiers: { tier: number; largeIcon: string | null }[] }>>('/competitivetiers'),
  ]);

  const latestTiers = tiers.data.at(-1)?.tiers ?? [];

  return {
    agents: Object.fromEntries(
      agents.data.map((a) => [a.uuid.toLowerCase(), { name: a.displayName, icon: a.displayIcon, portrait: a.fullPortrait }]),
    ),
    maps: Object.fromEntries(
      maps.data.map((m) => [m.mapUrl, { name: m.displayName, splash: m.splash, listView: m.listViewIcon }]),
    ),
    tierIcons: Object.fromEntries(latestTiers.filter((t) => t.largeIcon).map((t) => [t.tier, t.largeIcon!])),
  };
}

export function contentRoutes(app: FastifyInstance) {
  let cache: { data: ContentResponse; at: number } | null = null;

  app.get('/content', async (): Promise<ContentResponse> => {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
    cache = { data: await fetchContent(), at: Date.now() };
    return cache.data;
  });
}

// VALORANT queue ids as they appear in match data. Custom games have an empty queue id.

export type QueueFilter = 'all' | 'competitive' | 'unrated' | 'custom';

export const QUEUE_FILTERS: { key: QueueFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'competitive', label: 'Rekabetçi' },
  { key: 'unrated', label: 'Derecesiz' },
  { key: 'custom', label: 'Özel oyun' },
];

const QUEUE_NAMES: Record<string, string> = {
  competitive: 'Rekabetçi',
  unrated: 'Derecesiz',
  premier: 'Premier',
  swiftplay: 'Swiftplay',
  spikerush: 'Spike Rush',
  deathmatch: 'Deathmatch',
  ggteam: 'Escalation',
  hurm: 'Takım Deathmatch',
  '': 'Özel oyun',
};

export function queueName(queueId: string): string {
  return QUEUE_NAMES[queueId] ?? queueId;
}

/** Queue id to filter on for a filter key; null means no filter. */
export function queueIdForFilter(filter: QueueFilter): string | null {
  if (filter === 'all') return null;
  if (filter === 'custom') return '';
  return filter;
}

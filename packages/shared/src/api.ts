// Shapes exchanged between the server and the desktop client.
import type { Drill, MetricKey, WeakPoint } from './training.js';
import type { LevelProgress } from './xp.js';

export interface TrainingDrillDto extends Drill {
  completedToday: boolean;
}

export interface TrainingResponse {
  /** Worst weakness, or null when there's no match data or every target is met. */
  focus: MetricKey | null;
  weakPoints: WeakPoint[];
  /** Recommended order: drills for the worst weakness first. */
  drills: TrainingDrillDto[];
  week: { activeDays: number; xp: number };
  today: { rewarded: number; maxRewarded: number };
  /** Headshot % of the last matches, oldest first. */
  headshotTrend: number[];
}

export interface CompleteTrainingResponse {
  xpAwarded: number;
  /** True when this drill was already completed today. */
  alreadyDone: boolean;
}

export interface MeResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
  shard: Shard;
  level: LevelProgress;
  totalXp: number;
}

export type Shard = 'eu' | 'na' | 'ap' | 'kr';

export interface StatsSummary {
  matches: number;
  wins: number;
  losses: number;
  kd: number | null;
  headshotPct: number | null;
  adr: number | null;
  /** Official Riot competitive tier from the latest competitive match, if any. */
  competitiveTier: number | null;
}

export interface RecentMatch {
  matchId: string;
  mapId: string;
  queueId: string;
  startedAt: string;
  agentId: string;
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  headshotPct: number | null;
}

export interface AgentContent {
  name: string;
  icon: string;
  portrait: string | null;
}

export interface MapContent {
  name: string;
  splash: string | null;
  listView: string | null;
}

/** Display names and image URLs. Images are referenced by URL, never committed to the repo. */
export interface ContentResponse {
  /** Lower-cased agent UUID (match data `characterId`) → agent. */
  agents: Record<string, AgentContent>;
  /** Map asset path (match data `mapId`) → map. */
  maps: Record<string, MapContent>;
  /** Competitive tier number → rank icon URL. */
  tierIcons: Record<number, string>;
}

export type LfgKind = 'DUO' | 'TEAM' | 'FRIEND';

export interface LfgPostDto {
  id: string;
  kind: LfgKind;
  text: string;
  mode: string;
  roles: string[];
  tags: string[];
  micRequired: boolean;
  createdAt: string;
  author: {
    gameName: string;
    tagLine: string;
    level: number;
    /** Only present when the author opted into data sharing. */
    competitiveTier: number | null;
  };
}

export interface CreateLfgPostBody {
  kind: LfgKind;
  text: string;
  mode: string;
  roles: string[];
  tags: string[];
  micRequired: boolean;
}

// Shapes exchanged between the server and the desktop client.
import type { Badge } from './badges.js';
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

export interface MatchListResponse {
  items: RecentMatch[];
  /** Pass back as `cursor` to load older matches; null when there are no more. */
  nextCursor: string | null;
}

export interface ScoreboardRow {
  isMe: boolean;
  /** Riot ID, only for the viewer and for players who opted in to sharing. Others stay anonymous. */
  name: string | null;
  agentId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
}

export interface MatchDetail {
  matchId: string;
  mapId: string;
  queueId: string;
  startedAt: string;
  gameLengthMs: number;
  won: boolean;
  /** Each round from the viewer's side, in order. */
  rounds: ('win' | 'loss')[];
  me: {
    agentId: string;
    kills: number;
    deaths: number;
    assists: number;
    acs: number;
    adr: number | null;
    headshotPct: number | null;
    firstKills: number;
  };
  /** The viewer's team first. */
  teams: { mine: boolean; roundsWon: number; players: ScoreboardRow[] }[];
}

export interface AgentStat {
  agentId: string;
  games: number;
  wins: number;
  kd: number | null;
}

export interface MapStat {
  mapId: string;
  games: number;
  wins: number;
}

export interface XpHistoryItem {
  type: string;
  amount: number;
  createdAt: string;
  /** Set for match XP. */
  mapId: string | null;
  /** Set for training XP. */
  drillId: string | null;
}

export interface ProfileResponse {
  totals: { matches: number; customMatches: number; trainings: number; longestStreakWeeks: number };
  currentTier: number | null;
  /** Highest tier among stored competitive matches (not an official season peak). */
  peakTier: number | null;
  badges: Badge[];
  /** Most played first. */
  agents: AgentStat[];
  /** Most played first. */
  maps: MapStat[];
  xpHistory: XpHistoryItem[];
  settings: { dataSharing: boolean; publicProfile: boolean };
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

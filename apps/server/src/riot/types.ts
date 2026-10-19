// Subset of the VAL-MATCH-V1 response that DRILL uses.
// Full reference: https://developer.riotgames.com/apis#val-match-v1

export interface RiotMatchlist {
  puuid: string;
  history: { matchId: string; gameStartTimeMillis: number; queueId: string }[];
}

export interface RiotMatch {
  matchInfo: {
    matchId: string;
    mapId: string;
    queueId: string;
    gameStartMillis: number;
    isCompleted: boolean;
  };
  players: {
    puuid: string;
    teamId: string;
    characterId: string;
    competitiveTier: number;
    stats: {
      score: number;
      roundsPlayed: number;
      kills: number;
      deaths: number;
      assists: number;
    } | null;
  }[];
  teams: {
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
  }[];
  roundResults: {
    playerStats: {
      puuid: string;
      damage: { damage: number; headshots: number; bodyshots: number; legshots: number }[];
    }[];
  }[];
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotActiveShard {
  puuid: string;
  game: string;
  activeShard: string;
}

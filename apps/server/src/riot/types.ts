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
    gameLengthMillis: number | null;
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
      abilityCasts: {
        grenadeCasts: number;
        ability1Casts: number;
        ability2Casts: number;
        ultimateCasts: number;
      } | null;
    } | null;
  }[];
  teams: {
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
  }[];
  roundResults: {
    winningTeam: string;
    playerStats: {
      puuid: string;
      kills: { timeSinceRoundStartMillis: number; killer: string; victim: string }[];
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

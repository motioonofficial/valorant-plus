// XP comes from activity (playing, training, quests, community events), never from skill.
// Riot's policy forbids alternatives to the official ranked ladder, so nothing here may
// depend on kills, wins or any other performance number.

export const XP_RULES = {
  MATCH_COMPLETED: 80,
  LOBBY_MATCH_COMPLETED: 200,
  /** Default only; each drill in the training catalog defines its own XP. */
  TRAINING_COMPLETED: 40,
  WEEKLY_QUEST_COMPLETED: 150,
} as const;

export type XpEventType = keyof typeof XP_RULES;

/** XP needed to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError(`invalid level: ${level}`);
  return 1000 + 150 * (level - 1);
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  current: number;
  /** XP needed to finish the current level. */
  needed: number;
}

export function levelFromTotalXp(totalXp: number): LevelProgress {
  if (totalXp < 0) throw new RangeError(`negative xp: ${totalXp}`);
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, current: remaining, needed: xpForLevel(level) };
}

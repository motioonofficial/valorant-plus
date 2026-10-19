import { XP_RULES, levelFromTotalXp, type XpEventType } from '@drill/shared';
import { prisma } from '../db.js';

/** Awards XP once per (user, sourceKey). Returns true if XP was actually granted. */
export async function awardXp(userId: string, type: XpEventType, sourceKey: string): Promise<boolean> {
  const result = await prisma.xpEvent.createMany({
    data: [{ userId, type, amount: XP_RULES[type], sourceKey }],
    skipDuplicates: true,
  });
  return result.count > 0;
}

export async function getXp(userId: string) {
  const agg = await prisma.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } });
  const totalXp = agg._sum.amount ?? 0;
  return { totalXp, level: levelFromTotalXp(totalXp) };
}

import type { MeResponse } from '@drill/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth/session.js';
import { toShard, type RiotClient } from '../riot/client.js';
import { syncUserMatches } from '../services/matchSync.js';
import { getRecentMatches, getStatsSummary } from '../services/stats.js';
import { getXp } from '../services/xp.js';

export function meRoutes(app: FastifyInstance, riot: RiotClient) {
  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    scoped.get('/me', async (request): Promise<MeResponse> => {
      const user = request.user!;
      const { totalXp, level } = await getXp(user.id);
      return {
        puuid: user.puuid,
        gameName: user.gameName,
        tagLine: user.tagLine,
        shard: toShard(user.shard),
        totalXp,
        level,
      };
    });

    scoped.get('/me/stats', async (request) => getStatsSummary(request.user!.puuid));

    scoped.get('/me/matches', async (request) => getRecentMatches(request.user!.puuid));

    scoped.post('/me/sync', async (request) => syncUserMatches(riot, request.user!));

    scoped.patch('/me/settings', async (request) => {
      const body = z
        .object({ dataSharing: z.boolean().optional(), publicProfile: z.boolean().optional() })
        .parse(request.body);
      const user = await prisma.user.update({ where: { id: request.user!.id }, data: body });
      return { dataSharing: user.dataSharing, publicProfile: user.publicProfile };
    });

    scoped.delete('/me', async (request) => {
      // Unlinking deletes the account and everything cascading from it.
      await prisma.user.delete({ where: { id: request.user!.id } });
      return { ok: true };
    });
  });
}

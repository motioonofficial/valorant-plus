import type { MeResponse } from '@drill/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth/session.js';
import { toShard, type RiotClient } from '../riot/client.js';
import { syncUserMatches } from '../services/matchSync.js';
import { getMatchDetail, listMatches } from '../services/matches.js';
import { getProfile } from '../services/profile.js';
import { getStatsSummary } from '../services/stats.js';
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

    scoped.get('/me/profile', async (request) => getProfile(request.user!));

    scoped.get('/me/matches', async (request) => {
      const query = z
        .object({
          queue: z.enum(['all', 'competitive', 'unrated', 'custom']).default('all'),
          cursor: z.string().datetime().optional(),
          limit: z.coerce.number().int().min(1).max(50).optional(),
        })
        .parse(request.query);
      return listMatches(request.user!.puuid, query);
    });

    scoped.get('/me/matches/:matchId', async (request, reply) => {
      const { matchId } = z.object({ matchId: z.string().min(1).max(128) }).parse(request.params);
      const detail = await getMatchDetail(request.user!.puuid, matchId);
      // Same 404 for "doesn't exist" and "you weren't in it", so match ids can't be probed.
      if (!detail) return reply.code(404).send({ error: 'match_not_found' });
      return detail;
    });

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

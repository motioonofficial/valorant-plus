import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/session.js';
import { UnknownDrillError, completeTraining, getTraining } from '../services/training.js';

export function trainingRoutes(app: FastifyInstance) {
  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    scoped.get('/training', async (request) => getTraining(request.user!));

    scoped.post('/training/:drillId/complete', async (request, reply) => {
      const { drillId } = z.object({ drillId: z.string().min(1).max(64) }).parse(request.params);
      try {
        return await completeTraining(request.user!, drillId);
      } catch (err) {
        if (err instanceof UnknownDrillError) return reply.code(404).send({ error: 'unknown_drill' });
        throw err;
      }
    });
  });
}

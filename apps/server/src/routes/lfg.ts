import type { LfgPostDto } from '@drill/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth/session.js';
import { getSharedTier } from '../services/stats.js';
import { getXp } from '../services/xp.js';

const POST_TTL_HOURS = 24;
const MAX_ACTIVE_POSTS = 3;

const kind = z.enum(['DUO', 'TEAM', 'FRIEND']);
const tagList = z.array(z.string().trim().min(1).max(24)).max(6);

const createBody = z.object({
  kind,
  text: z.string().trim().min(3).max(280),
  mode: z.string().trim().min(1).max(32),
  roles: tagList,
  tags: tagList,
  micRequired: z.boolean(),
});

export function lfgRoutes(app: FastifyInstance) {
  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    scoped.get('/lfg', async (request): Promise<LfgPostDto[]> => {
      const { kind: k } = z.object({ kind: kind.optional() }).parse(request.query);
      const posts = await prisma.lfgPost.findMany({
        where: { kind: k, hidden: false, expiresAt: { gt: new Date() } },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return Promise.all(
        posts.map(async (p) => ({
          id: p.id,
          kind: p.kind,
          text: p.text,
          mode: p.mode,
          roles: p.roles,
          tags: p.tags,
          micRequired: p.micRequired,
          createdAt: p.createdAt.toISOString(),
          author: {
            gameName: p.user.gameName,
            tagLine: p.user.tagLine,
            level: (await getXp(p.user.id)).level.level,
            competitiveTier: await getSharedTier(p.user),
          },
        })),
      );
    });

    scoped.post('/lfg', async (request, reply) => {
      const body = createBody.parse(request.body);
      const userId = request.user!.id;

      const active = await prisma.lfgPost.count({ where: { userId, hidden: false, expiresAt: { gt: new Date() } } });
      if (active >= MAX_ACTIVE_POSTS) return reply.code(429).send({ error: 'too_many_active_posts' });

      const post = await prisma.lfgPost.create({
        data: { ...body, userId, expiresAt: new Date(Date.now() + POST_TTL_HOURS * 60 * 60 * 1000) },
      });
      return reply.code(201).send({ id: post.id });
    });

    scoped.post('/lfg/:id/report', async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const { reason } = z.object({ reason: z.string().trim().min(3).max(500) }).parse(request.body);
      await prisma.report.create({
        data: { reporterId: request.user!.id, targetType: 'lfg_post', targetId: id, reason },
      });
      return reply.code(201).send({ ok: true });
    });
  });
}

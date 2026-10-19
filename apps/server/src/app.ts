import cors from '@fastify/cors';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import type { Config } from './config.js';
import { RiotClient } from './riot/client.js';
import { authRoutes } from './routes/auth.js';
import { contentRoutes } from './routes/content.js';
import { lfgRoutes } from './routes/lfg.js';
import { meRoutes } from './routes/me.js';
import { trainingRoutes } from './routes/training.js';

export async function buildApp(config: Config) {
  const app = Fastify({ logger: true });
  const riot = new RiotClient(config.RIOT_API_KEY);

  app.decorateRequest('user', null);
  // The desktop renderer runs on a dev server / file:// origin, and requests use bearer tokens, not cookies.
  await app.register(cors, { origin: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: 'invalid_request', issues: error.issues });
    app.log.error(error);
    return reply.code(500).send({ error: 'internal_error' });
  });

  app.get('/health', async () => ({ ok: true }));
  authRoutes(app, config, riot);
  contentRoutes(app);
  meRoutes(app, riot);
  lfgRoutes(app);
  trainingRoutes(app);

  return app;
}

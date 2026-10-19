import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Config } from '../config.js';
import { prisma } from '../db.js';
import { TtlStore } from '../auth/ttlStore.js';
import { bearerToken, createSession, deleteSession, randomToken } from '../auth/session.js';
import type { RiotClient } from '../riot/client.js';
import { authorizeUrl, exchangeCode, fetchAccount } from '../riot/rso.js';

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

export function authRoutes(app: FastifyInstance, config: Config, riot: RiotClient) {
  // OAuth state → whether the player ticked the data-sharing opt-in on the login screen.
  const pendingStates = new TtlStore<{ dataSharing: boolean }>(TEN_MINUTES);
  // One-time code handed to the desktop app, exchanged for a session token.
  // Keeps the long-lived token out of URLs and browser history.
  const loginCodes = new TtlStore<string>(ONE_MINUTE);

  app.get('/auth/rso/login', async (request, reply) => {
    const { optIn } = z.object({ optIn: z.enum(['0', '1']).default('0') }).parse(request.query);
    const state = randomToken();
    pendingStates.set(state, { dataSharing: optIn === '1' });
    return reply.redirect(authorizeUrl(config, state));
  });

  app.get('/auth/rso/callback', async (request, reply) => {
    const { code, state } = z.object({ code: z.string(), state: z.string() }).parse(request.query);
    const pending = pendingStates.take(state);
    if (!pending) return reply.code(400).send({ error: 'invalid_state' });

    const { accessToken } = await exchangeCode(config, code);
    const account = await fetchAccount(accessToken);
    const { activeShard } = await riot.getActiveShard(account.puuid);

    const user = await prisma.user.upsert({
      where: { puuid: account.puuid },
      create: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        shard: activeShard,
        dataSharing: pending.dataSharing,
      },
      update: {
        gameName: account.gameName,
        tagLine: account.tagLine,
        shard: activeShard,
        dataSharing: pending.dataSharing,
      },
    });

    const token = await createSession(user.id);
    const oneTimeCode = randomToken();
    loginCodes.set(oneTimeCode, token);
    return reply.redirect(`${config.DESKTOP_CALLBACK_URL}?code=${encodeURIComponent(oneTimeCode)}`);
  });

  app.post('/auth/exchange', async (request, reply) => {
    const { code } = z.object({ code: z.string() }).parse(request.body);
    const token = loginCodes.take(code);
    if (!token) return reply.code(400).send({ error: 'invalid_code' });
    return { token };
  });

  app.post('/auth/logout', async (request) => {
    const token = bearerToken(request);
    if (token) await deleteSession(token);
    return { ok: true };
  });

  if (config.DEV_LOGIN) {
    app.log.warn('DEV_LOGIN is enabled. Do not use this on a public server.');
    app.post('/auth/dev-login', async () => {
      const user = await prisma.user.upsert({
        where: { puuid: 'dev-puuid' },
        create: { puuid: 'dev-puuid', gameName: 'Gelistirici', tagLine: 'DEV', shard: 'eu', dataSharing: true },
        update: {},
      });
      return { token: await createSession(user.id) };
    });
  }
}

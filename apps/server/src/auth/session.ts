import { createHash, randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db.js';

const SESSION_DAYS = 30;

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
  }
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Creates a session and returns the raw bearer token (only the hash is stored). */
export async function createSession(userId: string): Promise<string> {
  const token = randomToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
}

export function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

/** Fastify preHandler: rejects the request unless it carries a valid session. */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = bearerToken(request);
  if (!token) return reply.code(401).send({ error: 'unauthorized' });

  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return reply.code(401).send({ error: 'unauthorized' });

  request.user = session.user;
}

import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  // Loopback by default so a dev machine isn't reachable from the network; set 0.0.0.0 when deploying.
  HOST: z.string().default('127.0.0.1'),
  PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  RIOT_API_KEY: z.string().default(''),
  RSO_CLIENT_ID: z.string().default(''),
  RSO_CLIENT_SECRET: z.string().default(''),
  DESKTOP_CALLBACK_URL: z.string().default('drill://auth'),
  DEV_LOGIN: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}

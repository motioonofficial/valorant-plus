// Runs PostgreSQL inside the repo (apps/server/.pgdata) for contributors without Docker.
// Matches the DATABASE_URL in .env.example. Stop with Ctrl+C.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const databaseDir = resolve(import.meta.dirname, '../.pgdata');
const firstRun = !existsSync(databaseDir);

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'drill',
  password: 'drill',
  port: 5432,
  persistent: true,
  // initdb rejects non-ASCII Windows locale names (e.g. "Turkish_Türkiye.1254"), so pin a neutral one.
  initdbFlags: ['--locale=C', '--encoding=UTF8'],
});

if (firstRun) await pg.initialise();
await pg.start();
if (firstRun) await pg.createDatabase('drill');

console.log('PostgreSQL çalışıyor: postgresql://drill:drill@localhost:5432/drill (durdurmak için Ctrl+C)');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

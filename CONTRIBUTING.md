# Contributing

🇬🇧 English · 🇹🇷 [Türkçe](CONTRIBUTING.tr.md)

Thanks for wanting to contribute to DRILL! This guide covers setup, the rules, and what gets a pull request merged.

## Read this first: Riot's rules

DRILL can only exist as long as it follows the [Riot Developer Policy](https://developer.riotgames.com/policies/general). A PR that breaks these rules **won't be merged**, however good the code is:

| Don't | Why |
|---|---|
| Add a score, ELO/MMR or ranking based on performance (kills, wins, K/D…) | Riot forbids alternatives to the official ranked ladder. XP only comes from activity. |
| Show opponents' (or teammates') rank/stats before a match starts | Scouting isn't an approved use case. |
| Show data of a player who hasn't linked their account and enabled sharing | Opt-in is required. |
| Add an overlay that gives in-match information (economy, positions, live damage…) | Overlays that give an immediate advantage are forbidden. |
| Add betting, prize 1v1s or games of chance | Gambling is forbidden. |
| Use the Riot client's unofficial local API or automate the game | Breaks the ToS; users' accounts could get banned. |
| Add Riot images (agents, maps, rank icons) to the app code as files | Images are loaded by URL at runtime. The only exception is the promotional screenshots in `docs/screenshots/`. |

Not sure? Open an issue and ask first.

## Development setup

Requirement: Node.js 20+ (CI uses Node 22). No Docker or PostgreSQL install needed.

```bash
git clone https://github.com/motioonofficial/valorant-plus.git
cd valorant-plus
npm install

cp apps/server/.env.example apps/server/.env
# set DEV_LOGIN=true in .env (no Riot key needed)

npm run db:local -w @drill/server   # keep running in its own terminal
npm run db:migrate
npm run db:seed -w @drill/server    # sample matches
npm run dev:server
npm run dev:desktop
```

Use **developer login** on the login screen to sign in as a user with sample data.

## Project structure

```
apps/server      Fastify + Prisma: API, RSO, match sync, XP, LFG
apps/desktop     Electron + React: desktop client
packages/shared  Types and rules shared by server and client
```

Every type that travels between server and client is defined in `packages/shared/src/api.ts`. If you change an endpoint, update it there first.

## Before opening a PR

```bash
npm run typecheck
npm test
```

Both must pass; GitHub Actions runs the same checks on every PR.

- **Tests:** Write tests for pure logic (calculations, data mapping). Examples: `packages/shared/src/xp.test.ts`, `apps/server/src/services/matchMapper.test.ts`.
- **Database changes:** If you changed `prisma/schema.prisma`, create a migration with `npm run db:migrate -- --name short-description` and commit it.
- **Secrets:** Never commit a `.env` file or an API key. CI catches this and fails the PR. If you committed one by accident, regenerate the key in the Riot portal right away.
- **Keep it small:** One PR, one change. For a big feature, open an issue first so we can agree on the approach.

## Code style

- TypeScript in `strict` mode; no `any`.
- Match the surrounding code: naming, file layout, comment density.
- User-facing text is in Turkish for now; code, identifiers, commit messages and docs are in English.
- Comments explain *why*, not *what* (especially for decisions that come from Riot's rules).

## Commit messages

A short, imperative English subject line, with a body if needed:

```
Add weekly quest progress to the panel

Quests reset on Monday 00:00 Europe/Istanbul.
```

## Reporting issues

When reporting a bug, include: what you did, what you expected, what happened, your OS and Node version. If you found a security issue, don't open a public issue; contact the repo owner directly.

## License

Your contributions are released under the project's [MIT license](LICENSE).

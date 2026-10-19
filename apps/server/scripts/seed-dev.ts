// Fills the DEV_LOGIN user with sample matches and XP so the UI can be developed without a
// production Riot key. Sample data only; safe to run repeatedly.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PUUID = 'dev-puuid';

const AGENTS = {
  jett: 'add6443a-41bd-e414-f6ad-e58d267f4e95',
  sova: '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  omen: '8e253930-4c05-31dd-1b6c-968525494517',
};
const MAPS = {
  ascent: '/Game/Maps/Ascent/Ascent',
  bind: '/Game/Maps/Duality/Duality',
  haven: '/Game/Maps/Triad/Triad',
  lotus: '/Game/Maps/Jam/Jam',
  split: '/Game/Maps/Bonsai/Bonsai',
};

// [map, agent, roundsWon, roundsLost, kills, deaths, assists, headshots, bodyshots, legshots, damage, tier,
//  firstKills, firstDeaths, abilityCasts]
type Sample = [string, string, number, number, number, number, number, number, number, number, number, number, number, number, number];
const SAMPLES: Sample[] = [
  [MAPS.ascent, AGENTS.jett, 13, 9, 21, 15, 4, 24, 70, 6, 3500, 13, 4, 5, 30],
  [MAPS.bind, AGENTS.jett, 10, 13, 14, 17, 6, 15, 75, 10, 2900, 13, 2, 6, 27],
  [MAPS.haven, AGENTS.sova, 13, 11, 17, 14, 11, 20, 66, 8, 3300, 13, 2, 3, 41],
  [MAPS.lotus, AGENTS.jett, 13, 7, 19, 10, 3, 26, 68, 6, 3000, 12, 5, 3, 24],
  [MAPS.split, AGENTS.omen, 8, 13, 11, 16, 7, 14, 72, 12, 2400, 12, 1, 4, 33],
  [MAPS.ascent, AGENTS.jett, 13, 10, 18, 13, 5, 21, 71, 8, 3200, 12, 3, 5, 29],
  [MAPS.haven, AGENTS.sova, 11, 13, 15, 16, 9, 18, 70, 12, 3100, 12, 2, 4, 44],
  [MAPS.bind, AGENTS.omen, 13, 6, 16, 9, 8, 19, 69, 12, 2600, 12, 2, 2, 31],
];

const user = await prisma.user.upsert({
  where: { puuid: PUUID },
  create: { puuid: PUUID, gameName: 'Gelistirici', tagLine: 'DEV', shard: 'eu', dataSharing: true },
  update: {},
});

const now = Date.now();
for (const [i, s] of SAMPLES.entries()) {
  const [mapId, agentId, roundsWon, roundsLost, kills, deaths, assists, headshots, bodyshots, legshots, damage, tier,
    firstKills, firstDeaths, abilityCasts] = s;
  const matchId = `dev-sample-${i}`;
  const roundCount = roundsWon + roundsLost;
  await prisma.match.upsert({
    where: { matchId },
    create: { matchId, mapId, queueId: 'competitive', startedAt: new Date(now - (i + 1) * 3 * 60 * 60 * 1000), roundCount },
    update: {},
  });
  await prisma.matchPlayer.upsert({
    where: { matchId_puuid: { matchId, puuid: PUUID } },
    create: {
      matchId, puuid: PUUID, teamId: 'Red', agentId, won: roundsWon > roundsLost, roundsWon, roundsLost,
      kills, deaths, assists, score: kills * 200 + assists * 50 + 1000, damage, headshots, bodyshots, legshots,
      competitiveTier: tier, firstKills, firstDeaths, abilityCasts,
    },
    update: { firstKills, firstDeaths, abilityCasts },
  });
  await prisma.xpEvent.createMany({
    data: [{ userId: user.id, type: 'MATCH_COMPLETED', amount: 80, sourceKey: `match:${matchId}` }],
    skipDuplicates: true,
  });
}

console.log(`Örnek veri hazır: ${SAMPLES.length} maç, kullanıcı ${user.gameName}#${user.tagLine}`);
await prisma.$disconnect();

// Fills the DEV_LOGIN user with sample matches and XP so the UI can be developed without a
// production Riot key. Sample data only; safe to run repeatedly.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PUUID = 'dev-puuid';
// A teammate who "linked DRILL and opted in", so the scoreboard shows their name.
const FRIEND_PUUID = 'dev-friend-puuid';

const AGENTS = {
  jett: 'add6443a-41bd-e414-f6ad-e58d267f4e95',
  sova: '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
  omen: '8e253930-4c05-31dd-1b6c-968525494517',
  killjoy: '1e58de9c-4950-5125-93e9-a0aee9f98746',
  skye: '6f2a04ca-43e0-be17-7f36-b3908627744d',
  reyna: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
  brimstone: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
  cypher: '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
  sage: '569fdd95-4d10-43ab-ca70-79becc718b46',
  phoenix: 'eb93336a-449b-9c1b-0a54-a891f7921d69',
};
const MAPS = {
  ascent: '/Game/Maps/Ascent/Ascent',
  bind: '/Game/Maps/Duality/Duality',
  haven: '/Game/Maps/Triad/Triad',
  lotus: '/Game/Maps/Jam/Jam',
  split: '/Game/Maps/Bonsai/Bonsai',
};

// [map, agent, queue, roundsWon, roundsLost, kills, deaths, assists, headshots, bodyshots, legshots, damage, tier,
//  firstKills, firstDeaths, abilityCasts]
type Sample = [string, string, string, number, number, number, number, number, number, number, number, number, number, number, number, number];
const SAMPLES: Sample[] = [
  [MAPS.ascent, AGENTS.jett, 'competitive', 13, 9, 21, 15, 4, 24, 70, 6, 3500, 13, 4, 5, 30],
  [MAPS.bind, AGENTS.jett, 'competitive', 10, 13, 14, 17, 6, 15, 75, 10, 2900, 13, 2, 6, 27],
  [MAPS.haven, AGENTS.sova, '', 13, 11, 17, 14, 11, 20, 66, 8, 3300, 13, 2, 3, 41],
  [MAPS.lotus, AGENTS.jett, 'competitive', 13, 7, 19, 10, 3, 26, 68, 6, 3000, 12, 5, 3, 24],
  [MAPS.split, AGENTS.omen, 'unrated', 8, 13, 11, 16, 7, 14, 72, 12, 2400, 12, 1, 4, 33],
  [MAPS.ascent, AGENTS.jett, 'competitive', 13, 10, 18, 13, 5, 21, 71, 8, 3200, 12, 3, 5, 29],
  [MAPS.haven, AGENTS.sova, 'competitive', 11, 13, 15, 16, 9, 18, 70, 12, 3100, 12, 2, 4, 44],
  [MAPS.bind, AGENTS.omen, '', 13, 6, 16, 9, 8, 19, 69, 12, 2600, 12, 2, 2, 31],
];

// Deterministic pseudo-random numbers so every run produces the same data.
function rng(seed: number) {
  let s = seed;
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return min + (s % (max - min + 1));
  };
}

/** Round winners for a final score, with the winner taking the last round. */
function roundWinners(myTeam: string, theirTeam: string, won: number, lost: number, rand: ReturnType<typeof rng>): string[] {
  const winner = won > lost ? myTeam : theirTeam;
  const pool = [...Array(won).fill(myTeam), ...Array(lost).fill(theirTeam)] as string[];
  pool.splice(pool.lastIndexOf(winner), 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return [...pool, winner];
}

const user = await prisma.user.upsert({
  where: { puuid: PUUID },
  create: { puuid: PUUID, gameName: 'Gelistirici', tagLine: 'DEV', shard: 'eu', dataSharing: true },
  update: {},
});
await prisma.user.upsert({
  where: { puuid: FRIEND_PUUID },
  create: { puuid: FRIEND_PUUID, gameName: 'Duvar', tagLine: '4410', shard: 'eu', dataSharing: true },
  update: {},
});

const now = Date.now();
for (const [i, s] of SAMPLES.entries()) {
  const [mapId, agentId, queueId, roundsWon, roundsLost, kills, deaths, assists, headshots, bodyshots, legshots, damage, tier,
    firstKills, firstDeaths, abilityCasts] = s;
  const matchId = `dev-sample-${i}`;
  const roundCount = roundsWon + roundsLost;
  const rand = rng(i + 1);
  const winners = roundWinners('Red', 'Blue', roundsWon, roundsLost, rand);

  const matchData = {
    mapId, queueId, roundCount, roundWinners: winners,
    startedAt: new Date(now - (i + 1) * 3 * 60 * 60 * 1000),
    gameLengthMs: roundCount * 95_000 + rand(0, 120_000),
  };
  await prisma.match.upsert({ where: { matchId }, create: { matchId, ...matchData }, update: matchData });

  const others = Object.values(AGENTS).filter((a) => a !== agentId);
  const players = [
    {
      puuid: PUUID, teamId: 'Red', agentId, kills, deaths, assists, score: kills * 200 + assists * 50 + 1000, damage,
      headshots, bodyshots, legshots, competitiveTier: tier, firstKills, firstDeaths, abilityCasts,
    },
    ...others.slice(0, 9).map((otherAgent, k) => {
      const teamId = k < 4 ? 'Red' : 'Blue';
      const k2 = rand(6, 24);
      const a2 = rand(1, 12);
      return {
        puuid: k === 0 ? FRIEND_PUUID : `${matchId}-p${k}`,
        teamId, agentId: otherAgent, kills: k2, deaths: rand(8, 20), assists: a2, score: k2 * 200 + a2 * 50 + rand(300, 1500),
        damage: k2 * 140 + rand(0, 800), headshots: rand(8, 25), bodyshots: rand(50, 80), legshots: rand(3, 12),
        competitiveTier: tier + rand(-2, 2), firstKills: rand(0, 5), firstDeaths: rand(0, 5), abilityCasts: rand(20, 45),
      };
    }),
  ];

  for (const p of players) {
    const won = p.teamId === 'Red' ? roundsWon > roundsLost : roundsLost > roundsWon;
    const data = { ...p, won, roundsWon: p.teamId === 'Red' ? roundsWon : roundsLost, roundsLost: p.teamId === 'Red' ? roundsLost : roundsWon };
    await prisma.matchPlayer.upsert({
      where: { matchId_puuid: { matchId, puuid: p.puuid } },
      create: { matchId, ...data },
      update: data,
    });
  }

  await prisma.xpEvent.createMany({
    data: [{ userId: user.id, type: 'MATCH_COMPLETED', amount: 80, sourceKey: `match:${matchId}` }],
    skipDuplicates: true,
  });
}

console.log(`Örnek veri hazır: ${SAMPLES.length} maç (10'ar oyuncu), kullanıcı ${user.gameName}#${user.tagLine}`);
await prisma.$disconnect();

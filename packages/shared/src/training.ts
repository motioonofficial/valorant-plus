// Training catalog and weak-point analysis. Everything here is about the player's *own*
// numbers compared with fixed targets; nothing compares players with each other.

export type DrillCategory = 'aim' | 'movement' | 'tactics' | 'agent';
export type MetricKey = 'headshot' | 'openingDuel' | 'abilities';

export interface Drill {
  id: string;
  category: DrillCategory;
  title: string;
  minutes: number;
  xp: number;
  description: string;
  /** The weakness this drill works on; null for general drills. */
  metric: MetricKey | null;
}

export const DRILL_CATEGORIES: Record<DrillCategory, string> = {
  aim: 'Nişan',
  movement: 'Hareket',
  tactics: 'Taktik',
  agent: 'Ajan',
};

export const DRILLS: readonly Drill[] = [
  { id: 'headshot-line', category: 'aim', title: 'Kafa hizası', minutes: 15, xp: 50, metric: 'headshot', description: "Range'de zor botlar. Nişangahı kafa hizasında tut, yalnızca kafaya ateş et." },
  { id: 'tap-burst', category: 'aim', title: 'Tap ve burst', minutes: 10, xp: 40, metric: 'headshot', description: '20 m mesafede 1–2 mermi tap. Spray yapma, her atıştan sonra nişanı sıfırla.' },
  { id: 'jiggle-peek', category: 'movement', title: 'Peek ve geri çekil', minutes: 10, xp: 40, metric: 'openingDuel', description: 'Köşeden jiggle peek at, bilgi al, geri çekil. Açılış düellolarını kendi şartlarında al.' },
  { id: 'counter-strafe', category: 'movement', title: 'Counter-strafe', minutes: 10, xp: 30, metric: 'openingDuel', description: 'A-D hareketinden tam durup ateş et. Durma anını hisset, sonra tıkla.' },
  { id: 'review-openings', category: 'tactics', title: 'Açılışları izle', minutes: 20, xp: 60, metric: 'openingDuel', description: 'Kaybettiğin raundlarda ilk temas noktalarını maç geçmişinden incele.' },
  { id: 'utility-plan', category: 'tactics', title: 'Yetenek planı', minutes: 15, xp: 40, metric: 'abilities', description: 'Her raund için yeteneklerini nerede kullanacağını önceden planla; raund sonuna saklama.' },
  { id: 'agent-lineups', category: 'agent', title: 'Ajan lineup’ları', minutes: 15, xp: 50, metric: 'abilities', description: 'Ana ajanınla en çok oynadığın haritada 3 lineup’ı özel oyunda tekrar et.' },
];

export function findDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

export interface PlayerMetrics {
  /** headshots / all hits */
  headshotPct: number | null;
  /** firstKills / (firstKills + firstDeaths) */
  openingDuelWinRate: number | null;
  /** ability casts / rounds */
  abilitiesPerRound: number | null;
}

interface MetricDef {
  key: MetricKey;
  label: string;
  target: number;
  /** Upper bound of the progress bar. */
  scaleMax: number;
  read: (m: PlayerMetrics) => number | null;
  hint: string;
}

export const METRICS: readonly MetricDef[] = [
  { key: 'headshot', label: 'Headshot', target: 0.25, scaleMax: 0.4, read: (m) => m.headshotPct, hint: 'Nişan çoğunlukla gövde hizasında kalıyor.' },
  { key: 'openingDuel', label: 'Açılış düellosu', target: 0.5, scaleMax: 1, read: (m) => m.openingDuelWinRate, hint: 'Raundun ilk düellolarını çoğunlukla kaybediyorsun.' },
  { key: 'abilities', label: 'Yetenek / raund', target: 2, scaleMax: 3, read: (m) => m.abilitiesPerRound, hint: 'Yeteneklerini yeterince kullanmıyorsun.' },
];

export interface WeakPoint {
  key: MetricKey;
  label: string;
  value: number;
  target: number;
  scaleMax: number;
  /** 0 when the target is met, up to 1 when the value is zero. */
  severity: number;
  hint: string;
}

/** Metrics with data, worst first. */
export function analyzeWeakPoints(metrics: PlayerMetrics): WeakPoint[] {
  const points: WeakPoint[] = [];
  for (const def of METRICS) {
    const value = def.read(metrics);
    if (value == null) continue;
    const severity = value >= def.target ? 0 : (def.target - value) / def.target;
    points.push({ key: def.key, label: def.label, value, target: def.target, scaleMax: def.scaleMax, severity, hint: def.hint });
  }
  return points.sort((a, b) => b.severity - a.severity);
}

/** Drills for the worst weakness first, then the rest in catalog order. */
export function recommendDrills(points: WeakPoint[]): Drill[] {
  const order = points.filter((p) => p.severity > 0).map((p) => p.key);
  const rank = (d: Drill) => {
    const i = d.metric ? order.indexOf(d.metric) : -1;
    return i === -1 ? order.length : i;
  };
  return [...DRILLS].sort((a, b) => rank(a) - rank(b));
}

/** Training counts toward XP at most this many times per day, so self-reporting can't be farmed. */
export const MAX_REWARDED_TRAININGS_PER_DAY = 3;

const TIME_ZONE = 'Europe/Istanbul';

/** Calendar day (YYYY-MM-DD) in Europe/Istanbul. */
export function istanbulDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Monday (YYYY-MM-DD) of the week containing `day`. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

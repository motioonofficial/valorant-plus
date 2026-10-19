import { QUEUE_FILTERS, istanbulDay, queueName, type MatchDetail, type QueueFilter, type RecentMatch } from '@drill/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBox } from '../components/ErrorBox';
import { useAsync } from '../hooks/useAsync';
import { useContent } from '../hooks/useContent';

const pct = (v: number | null) => (v == null ? '–' : `%${Math.round(v * 100)}`);

function relativeDay(iso: string): string {
  const day = (d: Date) => new Date(`${istanbulDay(d)}T00:00:00Z`).getTime();
  const diff = Math.round((day(new Date()) - day(new Date(iso))) / 86_400_000);
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return `${diff} gün önce`;
}

function clock(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function Matches() {
  const [queue, setQueue] = useState<QueueFilter>('all');
  const [items, setItems] = useState<RecentMatch[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const page = await api.matches({ queue, cursor: reset ? undefined : (cursor ?? undefined) });
        setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
        setCursor(page.nextCursor);
        if (reset) setSelected(page.items[0]?.matchId ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Maçlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    },
    [queue, cursor],
  );

  // Reload from the top whenever the filter changes.
  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 className="page-title">MAÇ GEÇMİŞİ</h1>
        <div role="group" aria-label="Mod filtresi" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUEUE_FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={queue === f.key} onClick={() => setQueue(f.key)}>
              {f.label.toLocaleUpperCase('tr-TR')}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={`Maçlar yüklenemedi: ${error}`} onRetry={() => load(items.length === 0)} />}
      {!loading && items.length === 0 && !error && (
        <p className="muted">Bu filtrede maç yok. Panelden "Maçları eşitle" ile Riot'tan yeni maç çekebilirsin.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <section aria-label="Maç listesi" style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((m) => (
            <MatchListItem key={m.matchId} match={m} selected={m.matchId === selected} onSelect={() => setSelected(m.matchId)} />
          ))}
          {cursor && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 6, fontFamily: 'Barlow', fontSize: 14 }} onClick={() => load(false)} disabled={loading}>
              {loading ? 'Yükleniyor…' : 'Daha fazla yükle'}
            </button>
          )}
        </section>

        {selected && <MatchDetailPanel matchId={selected} />}
      </div>
    </>
  );
}

function MatchListItem({ match: m, selected, onSelect }: { match: RecentMatch; selected: boolean; onSelect: () => void }) {
  const content = useContent();
  const agent = content?.agents[m.agentId.toLowerCase()];
  const map = content?.maps[m.mapId];
  return (
    <button type="button" className={`match-item${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      {map?.listView && <img className="match-item-bg" src={map.listView} alt="" />}
      <span className="match-stripe" style={{ background: m.won ? 'var(--win)' : 'var(--accent)' }} />
      {agent ? <img className="match-agent" src={agent.icon} alt={agent.name} /> : <span className="match-agent" />}
      <span className="match-cell" style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 22, lineHeight: 1 }}>
          <span className={m.won ? 'win' : 'loss'}>{m.won ? 'ZAFER' : 'BOZGUN'}</span> {m.roundsWon}–{m.roundsLost}
        </span>
        <span className="faint" style={{ fontSize: 12 }}>
          {map?.name ?? m.mapId.split('/').pop()} · {queueName(m.queueId)}
        </span>
      </span>
      <span className="match-cell" style={{ alignItems: 'flex-end' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          {m.kills}/{m.deaths}/{m.assists}
        </span>
        <span className="faint" style={{ fontSize: 12 }}>{relativeDay(m.startedAt)}</span>
      </span>
    </button>
  );
}

function MatchDetailPanel({ matchId }: { matchId: string }) {
  const detail = useAsync(() => api.matchDetail(matchId), [matchId]);
  const content = useContent();

  if (detail.error) {
    return <ErrorBox message={`Maç detayı yüklenemedi: ${detail.error.message}`} onRetry={detail.reload} style={{ flex: '999 1 560px' }} />;
  }
  const d = detail.data;
  if (!d || d.matchId !== matchId) return <section className="card" style={{ flex: '999 1 560px', minHeight: 400 }} aria-busy="true" />;

  const map = content?.maps[d.mapId];
  const myAgent = content?.agents[d.me.agentId.toLowerCase()];
  const mine = d.teams.find((t) => t.mine);
  const theirs = d.teams.find((t) => !t.mine);

  return (
    <section aria-label="Maç detayı" className="card" style={{ flex: '999 1 560px', minWidth: 0, padding: 0, gap: 0 }}>
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {map?.splash && <img src={map.splash} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,25,35,0.55)' }} />
        <div style={{ position: 'relative', height: '100%', padding: '0 28px 22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: d.won ? 'var(--win)' : 'var(--accent)' }}>
              // {queueName(d.queueId).toLocaleUpperCase('tr-TR')} · {(map?.name ?? '').toLocaleUpperCase('tr-TR')} ·{' '}
              {relativeDay(d.startedAt).toLocaleUpperCase('tr-TR')} {clock(d.startedAt)}
              {d.gameLengthMs > 0 && ` · ${Math.round(d.gameLengthMs / 60_000)} DK`}
            </div>
            <div style={{ fontFamily: 'Teko', fontWeight: 700, fontSize: 84, lineHeight: 0.85, paddingTop: 8 }}>
              {d.won ? 'ZAFER' : 'BOZGUN'}{' '}
              <span className={d.won ? 'win' : 'loss'}>
                {mine?.roundsWon ?? 0}–{theirs?.roundsWon ?? 0}
              </span>
            </div>
          </div>
          {myAgent && <img src={myAgent.icon} alt={myAgent.name} width={76} height={76} style={{ background: 'rgba(15,25,35,0.7)' }} />}
        </div>
      </div>

      <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          <Stat label="K / D / A" value={`${d.me.kills}/${d.me.deaths}/${d.me.assists}`} />
          <Stat label="ACS" value={String(d.me.acs)} />
          <Stat label="HS%" value={pct(d.me.headshotPct)} />
          <Stat label="ADR" value={d.me.adr == null ? '–' : String(Math.round(d.me.adr))} />
          <Stat label="İLK KILL" value={String(d.me.firstKills)} />
        </div>

        {d.rounds.length > 0 && <RoundStrip rounds={d.rounds} />}

        {d.teams.map((team) => (
          <Scoreboard key={team.mine ? 'mine' : 'theirs'} team={team} />
        ))}
        <span className="faint">DRILL'e hesabını bağlamamış veya paylaşımı kapatmış oyuncuların adları gizlenir.</span>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <span className="tile-label" style={{ fontSize: 11 }}>{label}</span>
      <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 34, lineHeight: 1.05 }}>{value}</span>
    </div>
  );
}

function RoundStrip({ rounds }: { rounds: MatchDetail['rounds'] }) {
  const half = 12; // standard competitive halves
  const wins = (from: number, to: number) => rounds.slice(from, to).filter((r) => r === 'win').length;
  const first = `${wins(0, half)}-${Math.min(rounds.length, half) - wins(0, half)}`;
  const second = rounds.length > half ? `${wins(half, rounds.length)}-${rounds.length - half - wins(half, rounds.length)}` : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="tile-label">RAUNTLAR</span>
        <span className="tile-label">
          1. YARI {first}
          {second && ` · 2. YARI ${second}`}
        </span>
      </div>
      <div role="img" aria-label={`${rounds.length} raunt: ilk yarı ${first}${second ? `, ikinci yarı ${second}` : ''}`} style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {rounds.map((r, i) => (
          <span
            key={i}
            className="round-cell"
            style={{ background: r === 'win' ? 'var(--win)' : 'var(--accent)', marginLeft: i === half ? 10 : 0 }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function Scoreboard({ team }: { team: MatchDetail['teams'][number] }) {
  const content = useContent();
  const color = team.mine ? 'var(--win)' : 'var(--accent)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6, borderBottom: `2px solid ${color}` }}>
        <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 26, lineHeight: 1, color }}>
          {team.mine ? 'SENİN TAKIMIN' : 'RAKİP TAKIM'} · {team.roundsWon}
        </span>
        <span className="scoreboard-cols tile-label" style={{ fontSize: 11 }}>
          <span>K / D / A</span>
          <span>ACS</span>
        </span>
      </div>
      {team.players.map((p, i) => {
        const agent = content?.agents[p.agentId.toLowerCase()];
        return (
          <div key={i} className={`scoreboard-row${p.isMe ? ' me' : ''}`}>
            {agent ? <img src={agent.icon} alt={agent.name} width={46} height={46} /> : <span style={{ width: 46 }} />}
            <span style={{ flex: 1, fontSize: 14, fontWeight: p.isMe ? 700 : 600, color: p.isMe || p.name ? 'var(--text)' : 'var(--text-faint)' }}>
              {p.isMe ? 'Sen' : (p.name ?? 'Gizli oyuncu')}
            </span>
            <span className="scoreboard-cols">
              <span>
                {p.kills} / {p.deaths} / {p.assists}
              </span>
              <span>{p.acs}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

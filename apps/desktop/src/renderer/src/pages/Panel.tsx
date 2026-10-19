import { competitiveTierName, type RecentMatch } from '@drill/shared';
import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useContent } from '../hooks/useContent';

const pct = (v: number | null) => (v == null ? '–' : `%${Math.round(v * 100)}`);
const num = (v: number | null, digits = 2) => (v == null ? '–' : v.toFixed(digits));

function mostPlayedAgent(matches: RecentMatch[]): string | null {
  const counts = new Map<string, number>();
  for (const m of matches) counts.set(m.agentId.toLowerCase(), (counts.get(m.agentId.toLowerCase()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function Panel() {
  const me = useAsync(api.me);
  const stats = useAsync(api.stats);
  const matches = useAsync(api.matches);
  const content = useContent();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await api.sync();
      me.reload();
      stats.reload();
      matches.reload();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Eşitleme başarısız');
    } finally {
      setSyncing(false);
    }
  };

  if (me.error) return <div className="error">Profil yüklenemedi: {me.error.message}</div>;

  const mainAgentId = matches.data ? mostPlayedAgent(matches.data) : null;
  const mainAgent = mainAgentId ? content?.agents[mainAgentId] : undefined;
  const tier = stats.data?.competitiveTier ?? null;
  const tierIcon = tier != null ? content?.tierIcons[tier] : undefined;

  return (
    <>
      <section className="hero" aria-label="Profil">
        {mainAgent && (
          <>
            <div className="hero-watermark" aria-hidden="true">
              {mainAgent.name.toLocaleUpperCase('tr-TR')}
            </div>
            {mainAgent.portrait && <img className="hero-portrait" src={mainAgent.portrait} alt={mainAgent.name} />}
          </>
        )}
        <div className="hero-body">
          <div>
            <div className="eyebrow">// {mainAgent ? `ANA AJAN · ${mainAgent.name.toLocaleUpperCase('tr-TR')}` : 'PANEL'}</div>
            <h1 style={{ fontSize: 60, lineHeight: 0.95 }}>
              {me.data ? me.data.gameName.toLocaleUpperCase('tr-TR') : '…'}
              <span style={{ color: 'var(--text-faint)' }}>#{me.data?.tagLine}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div className="hero-chip">
              {tierIcon && <img src={tierIcon} alt="" width={56} height={56} />}
              <div>
                <div style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 30, lineHeight: 1 }}>
                  {stats.data ? competitiveTierName(tier).toLocaleUpperCase('tr-TR') : '…'}
                </div>
                <div className="faint">Resmi Riot rankı</div>
              </div>
            </div>
            {me.data && (
              <div className="hero-chip" style={{ flex: '1 1 260px', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 26, lineHeight: 1 }}>SEVİYE {me.data.level.level}</span>
                  <span className="faint">
                    {me.data.level.current} / {me.data.level.needed} XP
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${(me.data.level.current / me.data.level.needed) * 100}%` }} />
                </div>
                <span className="faint">XP aktiviteden gelir. Beceri puanı değildir.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tiles" aria-label="Son 20 maç özeti">
        <Tile label="K/D" value={num(stats.data?.kd ?? null)} />
        <Tile label="HEADSHOT" value={pct(stats.data?.headshotPct ?? null)} />
        <Tile label="ADR" value={num(stats.data?.adr ?? null, 0)} />
        <Tile label="KAZANMA" value={stats.data ? `${stats.data.wins}G · ${stats.data.losses}M` : '…'} />
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 30 }}>SON MAÇLAR</h2>
          <button type="button" className="btn" onClick={sync} disabled={syncing}>
            {syncing ? 'EŞİTLENİYOR…' : 'MAÇLARI EŞİTLE'}
          </button>
        </div>
        {syncError && <div className="error">Eşitleme başarısız: {syncError}</div>}
        {matches.data?.length === 0 && <p className="muted">Henüz maç yok. "Maçları eşitle" ile Riot'tan çek.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.data?.map((m) => {
            const agent = content?.agents[m.agentId.toLowerCase()];
            const map = content?.maps[m.mapId];
            return (
              <div key={m.matchId} className="match-row">
                {map?.listView && <img className="match-map" src={map.listView} alt="" />}
                <div className="match-stripe" style={{ background: m.won ? 'var(--win)' : 'var(--accent)' }} />
                {agent ? <img className="match-agent" src={agent.icon} alt={agent.name} /> : <div className="match-agent" />}
                <div className="match-cell" style={{ width: 130 }}>
                  <span className={`result ${m.won ? 'win' : 'loss'}`}>{m.won ? 'ZAFER' : 'BOZGUN'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{map?.name ?? m.mapId.split('/').pop()}</span>
                </div>
                <span className="match-cell" style={{ width: 80, fontFamily: 'Teko', fontWeight: 600, fontSize: 28 }}>
                  {m.roundsWon}–{m.roundsLost}
                </span>
                <div className="match-cell" style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 28 }}>
                  <Stat label="K / D / A" value={`${m.kills} / ${m.deaths} / ${m.assists}`} />
                  <Stat label="ACS" value={String(m.acs)} />
                  <Stat label="HS%" value={pct(m.headshotPct)} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

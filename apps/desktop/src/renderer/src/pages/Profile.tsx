import { competitiveTierName, findDrill, type ProfileResponse, type XpHistoryItem } from '@drill/shared';
import { useState } from 'react';
import { api } from '../api';
import { ErrorBox } from '../components/ErrorBox';
import { useAsync } from '../hooks/useAsync';
import { useContent } from '../hooks/useContent';

const HERO_MAP = '/Game/Maps/Triad/Triad'; // Haven
const pct = (wins: number, games: number) => (games === 0 ? 0 : Math.round((wins / games) * 100));

export function Profile() {
  const me = useAsync(api.me);
  const profile = useAsync(api.profile);
  const content = useContent();

  if (me.error || profile.error) {
    return (
      <ErrorBox
        message={`Profil yüklenemedi: ${(me.error ?? profile.error)!.message}`}
        onRetry={() => {
          me.reload();
          profile.reload();
        }}
      />
    );
  }
  const p = profile.data;
  const mainAgent = p?.agents[0] ? content?.agents[p.agents[0].agentId] : undefined;
  const splash = content?.maps[HERO_MAP]?.splash;

  return (
    <>
      <section className="hero" style={{ minHeight: 0 }} aria-label="Oyuncu kartı">
        {splash && <img src={splash} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,25,35,0.72)' }} />
        <div style={{ position: 'relative', padding: '32px 36px', display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
          {mainAgent ? (
            <img src={mainAgent.icon} alt={`Ana ajan: ${mainAgent.name}`} width={140} height={140} style={{ background: 'var(--accent)', clipPath: 'var(--cut)' }} />
          ) : (
            <div style={{ width: 140, height: 140, background: 'var(--accent)', clipPath: 'var(--cut)' }} />
          )}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="eyebrow">// OYUNCU KARTI · {me.data?.shard.toUpperCase()}</div>
              <h1 style={{ fontSize: 64, lineHeight: 0.95 }}>
                {me.data?.gameName.toLocaleUpperCase('tr-TR') ?? '…'}
                <span style={{ color: 'var(--text-faint)' }}>#{me.data?.tagLine}</span>
              </h1>
            </div>
            {me.data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 26, lineHeight: 1 }}>SEVİYE {me.data.level.level}</span>
                  <span style={{ fontSize: 13, color: '#c9cdd1' }}>
                    {me.data.level.current} / {me.data.level.needed} XP
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${(me.data.level.current / me.data.level.needed) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
          {p && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <RankChip tier={p.currentTier} label="Güncel rank" icon={p.currentTier != null ? content?.tierIcons[p.currentTier] : undefined} />
              <RankChip tier={p.peakTier} label="Kayıtlı maçlarda en yüksek" icon={p.peakTier != null ? content?.tierIcons[p.peakTier] : undefined} />
            </div>
          )}
        </div>
      </section>

      {p && (
        <>
          <section className="tiles" aria-label="Toplamlar">
            <Total label="KAYITLI MAÇ" value={String(p.totals.matches)} />
            <Total label="ÖZEL OYUN" value={String(p.totals.customMatches)} />
            <Total label="ANTRENMAN" value={String(p.totals.trainings)} />
            <Total label="EN UZUN SERİ" value={`${p.totals.longestStreakWeeks} HAFTA`} />
          </section>

          <Badges badges={p.badges} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            <section className="card" aria-labelledby="agents-h" style={{ flex: '1 1 380px', minWidth: 0 }}>
              <h2 id="agents-h" style={{ fontSize: 30 }}>AJANLAR</h2>
              {p.agents.length === 0 && <p className="muted">Henüz maç yok.</p>}
              {p.agents.slice(0, 5).map((a) => {
                const agent = content?.agents[a.agentId];
                return (
                  <div key={a.agentId} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 10, background: 'var(--bg)' }}>
                    {agent ? <img src={agent.icon} alt="" width={52} height={52} style={{ background: '#1a2733' }} /> : <span style={{ width: 52, height: 52 }} />}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{agent?.name ?? a.agentId.slice(0, 8)}</span>
                        <span className="faint">{a.games} maç</span>
                      </div>
                      <div className="bar" style={{ height: 4 }}>
                        <div style={{ width: `${(a.games / p.agents[0]!.games) * 100}%`, background: 'var(--win)' }} />
                      </div>
                    </div>
                    <MiniStat label="KAZANMA" value={`%${pct(a.wins, a.games)}`} width={70} />
                    <MiniStat label="K/D" value={a.kd == null ? '–' : a.kd.toFixed(2)} width={48} />
                  </div>
                );
              })}
            </section>

            <section className="card" aria-labelledby="maps-h" style={{ flex: '1 1 380px', minWidth: 0 }}>
              <h2 id="maps-h" style={{ fontSize: 30 }}>HARİTALAR</h2>
              {p.maps.length === 0 && <p className="muted">Henüz maç yok.</p>}
              {p.maps.map((m) => {
                const map = content?.maps[m.mapId];
                const win = pct(m.wins, m.games);
                return (
                  <div key={m.mapId} style={{ position: 'relative', height: 48, overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
                    {map?.listView && <img src={map.listView} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
                    <span style={{ position: 'relative', width: 90, fontFamily: 'Teko', fontWeight: 600, fontSize: 22, paddingTop: 2 }}>
                      {(map?.name ?? m.mapId.split('/').pop() ?? '').toLocaleUpperCase('tr-TR')}
                    </span>
                    <div className="bar" style={{ position: 'relative', flex: 1, background: 'rgba(42,57,71,0.9)' }}>
                      <div style={{ width: `${win}%`, background: win >= 50 ? 'var(--win)' : 'var(--accent)' }} />
                    </div>
                    <span style={{ position: 'relative', width: 44, textAlign: 'right', fontWeight: 700 }}>%{win}</span>
                    <span className="faint" style={{ position: 'relative', width: 50, textAlign: 'right' }}>{m.games} maç</span>
                  </div>
                );
              })}
            </section>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            <XpHistory items={p.xpHistory} />
            <Settings initial={p.settings} />
          </div>
        </>
      )}
    </>
  );
}

function RankChip({ tier, label, icon }: { tier: number | null; label: string; icon?: string }) {
  return (
    <div className="hero-chip">
      {icon && <img src={icon} alt="" width={52} height={52} />}
      <div>
        <div style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 28, lineHeight: 1 }}>{competitiveTierName(tier).toLocaleUpperCase('tr-TR')}</div>
        <div className="faint" style={{ fontSize: 12 }}>{label}</div>
      </div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile" style={{ clipPath: 'none' }}>
      <div className="tile-label">{label}</div>
      <div className="tile-value" style={{ fontSize: 44 }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, width }: { label: string; value: string; width: number }) {
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Badges({ badges }: { badges: ProfileResponse['badges'] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section aria-labelledby="badges-h" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 id="badges-h" style={{ fontSize: 32 }}>ROZETLER</h2>
        <span className="faint">
          {earned} / {badges.length} kazanıldı
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {badges.map((b) => (
          <div key={b.id} className="card" style={{ alignItems: 'center', textAlign: 'center', gap: 10, padding: '16px 10px', opacity: b.earned ? 1 : 0.55 }}>
            <div className="badge-hex" style={{ background: b.earned ? 'var(--warn)' : '#3e5466' }} aria-hidden="true">
              ★
            </div>
            <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 20, lineHeight: 1 }}>{b.name.toLocaleUpperCase('tr-TR')}</span>
            <span className="faint" style={{ fontSize: 12 }}>{b.description}</span>
            {!b.earned && b.progress && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                {b.progress.current} / {b.progress.target}
              </span>
            )}
            <span className="sr-only">{b.earned ? 'Kazanıldı' : 'Henüz kazanılmadı'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function XpHistory({ items }: { items: XpHistoryItem[] }) {
  const content = useContent();
  const describe = (e: XpHistoryItem) => {
    if (e.type === 'MATCH_COMPLETED') return `Maç tamamlandı${e.mapId ? ` · ${content?.maps[e.mapId]?.name ?? ''}` : ''}`;
    if (e.type === 'LOBBY_MATCH_COMPLETED') return '5v5 lobi maçı';
    if (e.type === 'TRAINING_COMPLETED') return `Antrenman: ${(e.drillId && findDrill(e.drillId)?.title) ?? ''}`;
    if (e.type === 'WEEKLY_QUEST_COMPLETED') return 'Haftalık görev';
    return e.type;
  };
  const when = (iso: string) => new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short' }).format(new Date(iso));

  return (
    <section className="card" aria-labelledby="xph-h" style={{ flex: '1 1 380px', minWidth: 0, gap: 4 }}>
      <h2 id="xph-h" style={{ fontSize: 30, marginBottom: 8 }}>XP GEÇMİŞİ</h2>
      {items.length === 0 && <p className="muted">Henüz XP kazanmadın.</p>}
      {items.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 40, borderBottom: '1px solid var(--line)', fontSize: 14 }}>
          <span style={{ width: 52, fontFamily: 'Teko', fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>+{e.amount}</span>
          <span style={{ flex: 1 }}>{describe(e)}</span>
          <span className="faint" style={{ fontSize: 12 }}>{when(e.createdAt)}</span>
        </div>
      ))}
    </section>
  );
}

function Settings({ initial }: { initial: ProfileResponse['settings'] }) {
  const [settings, setSettings] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggle = async (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next); // optimistic
    setError(null);
    try {
      setSettings(await api.updateSettings({ [key]: next[key] }));
    } catch {
      setSettings(settings);
      setError('Ayar kaydedilemedi, tekrar dene.');
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount();
      await window.drill.logout();
      window.location.reload(); // back to the login screen
    } catch {
      setDeleting(false);
      setError('Hesap silinemedi, tekrar dene.');
    }
  };

  const rows: { key: keyof typeof settings; label: string; hint: string }[] = [
    { key: 'dataSharing', label: 'Verilerimi paylaş', hint: 'Kapalıyken rankın ve adın diğer oyunculara gösterilmez' },
    { key: 'publicProfile', label: 'Adım maç tablolarında görünsün', hint: 'Kapalıyken diğerlerinin maç detayında "Gizli oyuncu" olarak görünürsün' },
  ];

  return (
    <section className="card" aria-labelledby="settings-h" style={{ flex: '1 1 380px', minWidth: 0, gap: 6 }}>
      <h2 id="settings-h" style={{ fontSize: 30, marginBottom: 8 }}>GİZLİLİK VE HESAP</h2>
      {rows.map((r) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 56, borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{r.label}</span>
            <span className="faint" style={{ fontSize: 12 }}>{r.hint}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings[r.key]}
            aria-label={r.label}
            className={`switch${settings[r.key] ? ' on' : ''}`}
            onClick={() => toggle(r.key)}
          >
            <span />
          </button>
        </div>
      ))}

      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}

      {!confirming ? (
        <button type="button" className="btn btn-ghost" style={{ marginTop: 14, borderColor: 'var(--accent)', color: 'var(--accent)', fontFamily: 'Barlow', fontSize: 14, fontWeight: 700 }} onClick={() => setConfirming(true)}>
          Riot hesabı bağlantısını kaldır ve hesabımı sil
        </button>
      ) : (
        <div style={{ marginTop: 14, padding: 14, background: '#3a1c22', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong>Emin misin? Bu geri alınamaz.</strong>
          <span style={{ fontSize: 13, color: '#ffb3ba' }}>
            Hesabın, XP'n, antrenmanların ve ilanların hemen silinir. Maç kayıtların, o maçlarda oynayan diğer oyuncuların geçmişinde adsız
            olarak kalır.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn" onClick={deleteAccount} disabled={deleting}>
              {deleting ? 'SİLİNİYOR…' : 'EVET, SİL'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={deleting}>
              VAZGEÇ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

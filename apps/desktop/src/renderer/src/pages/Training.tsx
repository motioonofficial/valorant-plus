import { DRILL_CATEGORIES, type DrillCategory, type MetricKey, type TrainingDrillDto, type WeakPoint } from '@drill/shared';
import { useState } from 'react';
import { api } from '../api';
import { ErrorBox } from '../components/ErrorBox';
import { useAsync } from '../hooks/useAsync';
import { useContent } from '../hooks/useContent';

const HERO_AGENT = '320b2a48-4d9b-a075-30f1-1f93a9b638fa'; // Sova

const FOCUS: Record<MetricKey, { title: string; text: (p: WeakPoint) => string }> = {
  headshot: {
    title: 'KAFA HİZASI',
    text: (p) => `Son maçlarda headshot oranın ${pct(p.value)}. Hedef bu hafta ${pct(p.target)}.`,
  },
  openingDuel: {
    title: 'AÇILIŞ DÜELLOLARI',
    text: (p) => `Raundun ilk düellolarının ${pct(p.value)} kadarını kazanıyorsun. Hedef ${pct(p.target)}.`,
  },
  abilities: {
    title: 'YETENEK KULLANIMI',
    text: (p) => `Raund başına ${p.value.toFixed(1)} yetenek kullanıyorsun. Hedef ${p.target.toFixed(1)}.`,
  },
};

const pct = (v: number) => `%${Math.round(v * 100)}`;
const formatValue = (p: WeakPoint) => (p.key === 'abilities' ? p.value.toFixed(1) : pct(p.value));
const formatTarget = (p: WeakPoint) => (p.key === 'abilities' ? p.target.toFixed(1) : pct(p.target));

type Filter = 'all' | DrillCategory;

export function Training() {
  const training = useAsync(api.training);
  const portrait = useContent()?.agents[HERO_AGENT]?.portrait;
  const [filter, setFilter] = useState<Filter>('all');
  const [notice, setNotice] = useState<string | null>(null);

  if (training.error) return <ErrorBox message={`Antrenman yüklenemedi: ${training.error.message}`} onRetry={training.reload} />;
  const data = training.data;

  const focusPoint = data?.focus ? data.weakPoints.find((p) => p.key === data.focus) : undefined;
  const drills = data?.drills.filter((d) => filter === 'all' || d.category === filter) ?? [];

  const complete = async (drill: TrainingDrillDto) => {
    setNotice(null);
    try {
      const res = await api.completeTraining(drill.id);
      if (res.alreadyDone) setNotice(`"${drill.title}" bugün zaten tamamlandı.`);
      else if (res.xpAwarded > 0) setNotice(`"${drill.title}" tamamlandı: +${res.xpAwarded} XP`);
      else setNotice(`"${drill.title}" tamamlandı. Bugünkü antrenman XP sınırına ulaştın, yarın tekrar XP kazanırsın.`);
      training.reload();
    } catch (err) {
      setNotice(err instanceof Error ? `Kaydedilemedi: ${err.message}` : 'Kaydedilemedi');
    }
  };

  return (
    <>
      <section className="hero" style={{ minHeight: 260 }} aria-label="Haftanın odağı">
        {portrait && <img className="hero-portrait" src={portrait} alt="" style={{ right: 20, top: -40, bottom: 'auto', height: 500 }} />}
        <div className="hero-body" style={{ maxWidth: 620 }}>
          <div>
            <div className="eyebrow">// BU HAFTANIN ODAĞI</div>
            <h1 style={{ fontSize: 72, lineHeight: 0.9 }}>{focusPoint ? FOCUS[focusPoint.key].title : 'FORMUNU KORU'}</h1>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#c9cdd1', maxWidth: 460 }}>
              {focusPoint
                ? FOCUS[focusPoint.key].text(focusPoint)
                : data && data.weakPoints.length === 0
                  ? 'Henüz analiz edecek maç yok. Maçlarını eşitledikten sonra sana özel bir odak çıkar.'
                  : 'Bütün hedeflerin tutuyor. Genel antrenmanlarla formunu koru.'}
            </p>
          </div>
          {data && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <HeroStat label="BU HAFTA ANTRENMAN" value={`${data.week.activeDays} / 7 GÜN`} />
              <HeroStat label="BU HAFTA KAZANILAN" value={`+${data.week.xp} XP`} accent />
              <HeroStat label="BUGÜN XP VEREN" value={`${data.today.rewarded} / ${data.today.maxRewarded}`} />
            </div>
          )}
        </div>
      </section>

      {data && data.weakPoints.length > 0 && (
        <section aria-labelledby="weak-h" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 id="weak-h" style={{ fontSize: 32 }}>ZAYIF NOKTALARIN</h2>
            <span className="faint">Son 20 maça göre</span>
          </div>
          <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {data.weakPoints.map((p) => (
              <div key={p.key} className="card" style={{ gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="tile-label">{p.label.toLocaleUpperCase('tr-TR')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.severity > 0 ? 'var(--warn)' : 'var(--win)' }}>
                    {p.severity > 0 ? `HEDEF ${formatTarget(p)}` : 'HEDEF TUTUYOR'}
                  </span>
                </div>
                <div className="tile-value" style={{ fontSize: 52, lineHeight: 0.9 }}>{formatValue(p)}</div>
                <div className="bar" style={{ position: 'relative', height: 8 }}>
                  <div style={{ width: `${Math.min(p.value / p.scaleMax, 1) * 100}%`, background: p.severity > 0 ? 'var(--warn)' : 'var(--win)' }} />
                  <div style={{ position: 'absolute', top: -4, left: `${(p.target / p.scaleMax) * 100}%`, width: 2, height: 16, background: 'var(--text)' }} />
                </div>
                {p.severity > 0 && <span className="muted" style={{ fontSize: 13 }}>{p.hint}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="drill-h" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 id="drill-h" style={{ fontSize: 32 }}>ANTRENMAN PROGRAMI</h2>
          <div role="group" aria-label="Kategori" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(['all', ...Object.keys(DRILL_CATEGORIES)] as Filter[]).map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {(f === 'all' ? 'Tümü' : DRILL_CATEGORIES[f]).toLocaleUpperCase('tr-TR')}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div role="status" className="card" style={{ padding: '12px 16px', flexDirection: 'row' }}>
            {notice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {drills.map((d) => (
            <article key={d.id} className="card card-cut" style={{ gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ padding: '3px 8px 2px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--win)' }}>
                  {DRILL_CATEGORIES[d.category].toLocaleUpperCase('tr-TR')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>+{d.xp} XP</span>
              </div>
              <h3 style={{ fontSize: 30 }}>{d.title.toLocaleUpperCase('tr-TR')}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45, flex: 1 }}>{d.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#c9cdd1' }}>{d.minutes} dk</span>
                {d.completedToday ? (
                  <span style={{ minHeight: 40, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--win)' }}>✓ BUGÜN TAMAMLANDI</span>
                ) : (
                  <button type="button" className="btn" style={{ minHeight: 40, fontSize: 20 }} onClick={() => complete(d)}>
                    TAMAMLADIM
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="faint">
          Antrenmanı bitirdiğinde kendin işaretlersin; gelişimini maç verilerinden ölçeriz. Günde en fazla{' '}
          {data?.today.maxRewarded ?? 3} antrenman XP verir.
        </p>
      </section>

      {data && data.headshotTrend.length > 0 && (
        <section className="card" aria-labelledby="trend-h">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 id="trend-h" style={{ fontSize: 32 }}>GELİŞİM · HEADSHOT %</h2>
            <span className="faint">Son {data.headshotTrend.length} maç · çizgi: hedef %25</span>
          </div>
          <HeadshotChart values={data.headshotTrend} target={0.25} />
        </section>
      )}
    </>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="hero-chip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'Teko', fontWeight: 600, fontSize: 32, lineHeight: 1.1, color: accent ? 'var(--accent)' : undefined }}>{value}</span>
    </div>
  );
}

function HeadshotChart({ values, target }: { values: number[]; target: number }) {
  const max = 0.4;
  const height = 180;
  const summary = `Son ${values.length} maçta headshot oranı ${values.map(pct).join(', ')}`;
  return (
    <div role="img" aria-label={summary} style={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: 10, borderBottom: '1px solid #2e3d4b' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: (target / max) * height, borderTop: '2px dashed var(--warn)' }} />
      {values.map((v, i) => (
        <div key={i} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#c9cdd1' }}>{pct(v)}</span>
          <div style={{ width: '100%', maxWidth: 48, height: Math.min(v / max, 1) * (height - 24), background: v >= target ? 'var(--win)' : '#3e5466' }} />
        </div>
      ))}
    </div>
  );
}

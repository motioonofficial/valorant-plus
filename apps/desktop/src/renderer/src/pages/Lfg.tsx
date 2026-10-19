import { competitiveTierName, type LfgKind } from '@drill/shared';
import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../api';
import { ErrorBox } from '../components/ErrorBox';
import { useAsync } from '../hooks/useAsync';
import { useContent } from '../hooks/useContent';

const TABS: { kind: LfgKind; label: string }[] = [
  { kind: 'DUO', label: 'DUO' },
  { kind: 'TEAM', label: 'TAKIM' },
  { kind: 'FRIEND', label: 'ARKADAŞ' },
];

const splitTags = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export function Lfg() {
  const [kind, setKind] = useState<LfgKind>('DUO');
  const posts = useAsync(() => api.lfg(kind), [kind]);
  const content = useContent();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">// TOPLULUK</div>
          <h1 className="page-title">OYUNCU BUL</h1>
        </div>
        <button type="button" className="btn" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? 'VAZGEÇ' : '+ İLAN VER'}
        </button>
      </div>

      {formOpen && (
        <NewPostForm
          kind={kind}
          onCreated={() => {
            setFormOpen(false);
            posts.reload();
          }}
        />
      )}

      <div role="tablist" aria-label="İlan türü" style={{ display: 'flex', gap: 6 }}>
        {TABS.map((t) => (
          <button key={t.kind} type="button" role="tab" className="chip" aria-selected={kind === t.kind} onClick={() => setKind(t.kind)}>
            {t.label}
          </button>
        ))}
      </div>

      {posts.error && <ErrorBox message={`İlanlar yüklenemedi: ${posts.error.message}`} onRetry={posts.reload} />}
      {posts.data?.length === 0 && <p className="muted">Bu kategoride henüz ilan yok. İlk ilanı sen ver.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {posts.data?.map((p) => (
          <article key={p.id} className="card card-cut">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {p.author.gameName}#{p.author.tagLine}
                </div>
                <div className="faint">
                  Seviye {p.author.level} · {p.mode}
                </div>
              </div>
              {p.author.competitiveTier != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Teko', fontSize: 22, fontWeight: 600 }}>
                  {content?.tierIcons[p.author.competitiveTier] && (
                    <img src={content.tierIcons[p.author.competitiveTier]} alt="" width={34} height={34} />
                  )}
                  {competitiveTierName(p.author.competitiveTier)}
                </span>
              )}
            </div>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{p.text}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[...p.roles, ...p.tags, ...(p.micRequired ? ['MİKROFON'] : [])].map((t) => (
                <span key={t} style={{ padding: '4px 8px 3px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--win)' }}>
                  {t.toUpperCase()}
                </span>
              ))}
            </div>
            <ReportButton postId={p.id} />
          </article>
        ))}
      </div>

      <p className="faint">
        Rank yalnızca Riot hesabını bağlayıp veri paylaşımını açan oyuncularda görünür. Uygunsuz ilanları şikayet et.
      </p>
    </>
  );
}

function NewPostForm({ kind, onCreated }: { kind: LfgKind; onCreated: () => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('Rekabetçi');
  const [roles, setRoles] = useState('');
  const [tags, setTags] = useState('');
  const [micRequired, setMicRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createLfg({ kind, text, mode, roles: splitTags(roles), tags: splitTags(tags), micRequired });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'too_many_active_posts') setError('Aynı anda en fazla 3 aktif ilanın olabilir.');
      else setError('İlan oluşturulamadı. Metin 3–280 karakter olmalı.');
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ fontSize: 28 }}>YENİ İLAN · {TABS.find((t) => t.kind === kind)?.label}</h2>
      <label className="field">
        AÇIKLAMA
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={280} rows={3} required />
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <label className="field" style={{ flex: '1 1 160px' }}>
          MOD
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Rekabetçi</option>
            <option>Derecesiz</option>
            <option>5v5 Lobi</option>
          </select>
        </label>
        <label className="field" style={{ flex: '1 1 200px' }}>
          ROLLER (virgülle)
          <input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="Düellocu, Gözcü" />
        </label>
        <label className="field" style={{ flex: '1 1 200px' }}>
          ETİKETLER (virgülle)
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="20:00–24:00, 18+" />
        </label>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
        <input type="checkbox" checked={micRequired} onChange={(e) => setMicRequired(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} />
        Mikrofon gerekli
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit" className="btn" style={{ alignSelf: 'flex-start' }}>
        YAYINLA
      </button>
    </form>
  );
}

function ReportButton({ postId }: { postId: string }) {
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');

  const report = async () => {
    try {
      await api.reportLfg(postId, 'Kullanıcı tarafından uygunsuz olarak işaretlendi');
      setState('sent');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') return <span className="faint">Şikayetin moderatörlere iletildi.</span>;
  return (
    <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 18, minHeight: 36 }} onClick={report}>
      {state === 'error' ? 'TEKRAR DENE' : 'ŞİKAYET ET'}
    </button>
  );
}

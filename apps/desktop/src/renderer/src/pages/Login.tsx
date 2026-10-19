import { useState } from 'react';
import { useContent } from '../hooks/useContent';

const LOGIN_AGENT = 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc'; // Reyna

export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const portrait = useContent()?.agents[LOGIN_AGENT]?.portrait;
  const [optIn, setOptIn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setWaiting(true);
    await window.drill.login(optIn);
    // The session arrives via the drill:// callback; App listens for it.
  };

  const devLogin = async () => {
    setError(null);
    try {
      await window.drill.devLogin();
      onSignedIn();
    } catch {
      setError('Geliştirici girişi başarısız. Sunucu DEV_LOGIN=true ile mi çalışıyor?');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <section className="login-art" aria-hidden="true">
        <div className="login-art-text">
          OYNA
          <br />
          ÖLÇ
          <br />
          GELİŞ
        </div>
        {portrait && <img src={portrait} alt="" />}
      </section>
      <div style={{ flex: '1 1 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div className="brand" style={{ fontSize: 44 }}>
          <div className="brand-mark" style={{ width: 36, height: 36 }} />
          DRILL
        </div>
        <div>
          <h1 style={{ fontSize: 72, lineHeight: 0.9 }}>
            OYNA. ÖLÇ.
            <br />
            <span style={{ color: 'var(--accent)' }}>GELİŞ.</span>
          </h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.5 }}>
            Maçlarını analiz et, sana özel antrenman al, arkadaşlarınla dengeli 5v5 maçlar kur.
          </p>
        </div>

        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            style={{ width: 20, height: 20, margin: '2px 0 0', accentColor: 'var(--accent)' }}
          />
          <span>
            Hesabımı bağladığımda oyuncu verilerimin DRILL'de diğer oyunculara görünür olacağını anlıyorum. İstediğim
            zaman bağlantıyı kaldırabilirim.
          </span>
        </label>

        <button type="button" className="btn" style={{ minHeight: 60, fontSize: 28 }} onClick={login} disabled={waiting}>
          {waiting ? 'TARAYICIDA GİRİŞ BEKLENİYOR…' : 'RIOT HESABINLA GİRİŞ YAP'}
        </button>

        {import.meta.env.DEV && (
          <button type="button" className="btn btn-ghost" onClick={devLogin}>
            GELİŞTİRİCİ GİRİŞİ (DEV_LOGIN)
          </button>
        )}
        {error && <div className="error">{error}</div>}

        <p className="disclaimer">
          DRILL, Riot Games tarafından onaylanmamıştır ve Riot Games'in görüşlerini yansıtmaz. Riot Games ve ilişkili
          tüm mülkler Riot Games, Inc.'in ticari markalarıdır.
        </p>
      </div>
      </div>
    </div>
  );
}

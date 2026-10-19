import { NavLink, Outlet } from 'react-router-dom';

const APP_LINKS = [
  { to: '/', label: 'PANEL' },
  { to: '/training', label: 'ANTRENMAN' },
  { to: '/matches', label: 'MAÇLAR' },
  { to: '/lobby', label: '5V5 LOBİ' },
  { to: '/profile', label: 'PROFİL' },
];

const COMMUNITY_LINKS = [
  { to: '/lfg', label: 'OYUNCU BUL' },
  { to: '/chat', label: 'SOHBET' },
  { to: '/news', label: 'HABERLER' },
  { to: '/duel', label: '1V1 DÜELLO' },
];

export function Layout({ onLogout }: { onLogout: () => void }) {
  const link = ({ to, label }: { to: string; label: string }) => (
    <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : undefined)}>
      {label}
    </NavLink>
  );

  return (
    <div className="layout">
      <nav className="sidebar" aria-label="Ana menü">
        <div className="brand">
          <div className="brand-mark" />
          DRILL
        </div>
        <div className="nav">
          {APP_LINKS.map(link)}
          <div className="nav-label">TOPLULUK</div>
          {COMMUNITY_LINKS.map(link)}
        </div>
        <button type="button" className="btn btn-ghost" style={{ marginTop: 'auto' }} onClick={onLogout}>
          ÇIKIŞ YAP
        </button>
      </nav>
      <main className="content">
        <Outlet />
        <p className="disclaimer">
          DRILL, Riot Games tarafından onaylanmamıştır ve Riot Games'in ya da Riot Games mülklerinin yapımında veya
          yönetiminde resmi olarak yer alan kimsenin görüş ve fikirlerini yansıtmaz. Riot Games ve ilişkili tüm mülkler
          Riot Games, Inc.'in ticari markaları veya tescilli ticari markalarıdır.
        </p>
      </main>
    </div>
  );
}

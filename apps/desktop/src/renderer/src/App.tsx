import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ComingSoon } from './pages/ComingSoon';
import { Lfg } from './pages/Lfg';
import { Login } from './pages/Login';
import { Panel } from './pages/Panel';
import { Training } from './pages/Training';

export function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    setSignedIn((await window.drill.getToken()) !== null);
  }, []);

  useEffect(() => {
    void refresh();
    return window.drill.onAuthChanged(() => void refresh());
  }, [refresh]);

  const logout = async () => {
    await window.drill.logout();
    setSignedIn(false);
  };

  if (signedIn === null) return null;
  if (!signedIn) return <Login onSignedIn={refresh} />;

  // HashRouter: the production build is loaded from file://, where path routing doesn't work.
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout onLogout={logout} />}>
          <Route index element={<Panel />} />
          <Route path="training" element={<Training />} />
          <Route path="matches" element={<ComingSoon title="Maçlar" phase={1} />} />
          <Route path="lobby" element={<ComingSoon title="5v5 Lobi" phase={3} />} />
          <Route path="profile" element={<ComingSoon title="Profil" phase={1} />} />
          <Route path="lfg" element={<Lfg />} />
          <Route path="chat" element={<ComingSoon title="Sohbet" phase={2} />} />
          <Route path="news" element={<ComingSoon title="Haberler" phase={2} />} />
          <Route path="duel" element={<ComingSoon title="1v1 Düello" phase={3} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

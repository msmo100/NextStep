import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Kanban, Search, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          {/* Logotyp/varumärke. */}
          <div className="header-brand">
            <h1>NextStep</h1>
            <span className="header-byline">by Max Moro</span>
          </div>
          {/* Navigeringslänkar. NavLink markerar automatiskt den aktiva sidan. */}
          <nav className="header-nav">
            <NavLink to="/" end>
              <Kanban size={18} />
              <span>Lista</span>
            </NavLink>
            <NavLink to="/search">
              <Search size={18} />
              <span>Sök jobb</span>
            </NavLink>
            <NavLink to="/statistics">
              <BarChart3 size={18} />
              <span>Statistik</span>
            </NavLink>
            {/* Utloggningsknappen visas bara när någon är inloggad. */}
            {user && (
              <button type="button" className="header-nav-logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logga ut</span>
              </button>
            )}
          </nav>
        </div>
      </header>
      {/* Här renderas den aktuella sidan (tavlan, sökningen eller statistiken). */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

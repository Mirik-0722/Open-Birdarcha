import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconRoute, IconSearch } from "../icons";
import { useAuth } from "../AuthContext";
import { userDisplayName } from "../auth";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/";
  const { user, logout } = useAuth();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Inputni URL ?q bilan sinxron saqlash: SearchPage yoki misol-chiplar
  // navigatsiya qilganda header qidiruvi ham yangilanadi.
  const urlQ = new URLSearchParams(location.search).get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="app-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="7" r="2.2" fill="#fff" />
              <circle cx="18" cy="6" r="2.2" fill="#fff" />
              <circle cx="13" cy="18" r="2.2" fill="#fff" />
              <path d="M6 7l12-1M18 6l-5 12M6 7l7 11" stroke="#fff" strokeWidth="1.3" strokeOpacity=".85" />
            </svg>
          </span>
          Open&nbsp;<b>Birdarcha</b>
        </Link>

        {!onHome && (
          <div className="header-search">
            <form onSubmit={submit}>
              <span className="lead-ico"><IconSearch size={17} /></span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma, STIR yoki shaxs..."
              />
            </form>
          </div>
        )}

        <nav className="header-nav">
          <Link to="/path">
            <IconRoute size={16} /> Bog'lanish zanjiri
          </Link>
          <span className="header-user" title={user?.phone ?? undefined}>
            {user?.photo ? (
              <img className="header-avatar" src={user.photo} alt="" />
            ) : (
              <span className="header-avatar header-avatar--ph">
                {userDisplayName(user).charAt(0).toUpperCase()}
              </span>
            )}
            {userDisplayName(user)}
          </span>
          <button className="logout-btn" onClick={onLogout}>
            Chiqish
          </button>
        </nav>
      </div>
    </header>
  );
}

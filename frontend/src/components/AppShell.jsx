import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Icon from './Icon';
import styles from './AppShell.module.css';

const ATHLETE_NAV = [
  { to: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: 'home' },
  { to: '/workouts', label: 'Workouts', mobileLabel: 'Train', icon: 'dumbbell' },
  { to: '/progress', label: 'Progress', icon: 'trending' },
  { to: '/meals', label: 'Meals', icon: 'apple' },
  { to: '/reels', label: 'Reels', icon: 'video' },
  { to: '/friends', label: 'Friends', icon: 'users' },
  { to: '/chat', label: 'Chat', icon: 'message' },
];

const COACH_NAV = [
  { to: '/coach', label: 'Athletes', mobileLabel: 'Athletes', icon: 'users' },
  { to: '/workouts', label: 'Workouts', mobileLabel: 'Train', icon: 'dumbbell' },
  { to: '/meals', label: 'Meals', icon: 'apple' },
  { to: '/progress', label: 'Progress', icon: 'trending' },
  { to: '/reels', label: 'Reels', icon: 'video' },
  { to: '/friends', label: 'Friends', icon: 'users' },
  { to: '/chat', label: 'Chat', icon: 'message' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Admin', mobileLabel: 'Admin', icon: 'grid' },
  { to: '/workouts', label: 'Workouts', mobileLabel: 'Train', icon: 'dumbbell' },
  { to: '/meals', label: 'Meals', icon: 'apple' },
  { to: '/progress', label: 'Progress', icon: 'trending' },
  { to: '/reels', label: 'Reels', icon: 'video' },
  { to: '/friends', label: 'Friends', icon: 'users' },
  { to: '/chat', label: 'Chat', icon: 'message' },
];

const MOBILE_TAB_PATHS = {
  athlete: ['/dashboard', '/workouts', '/reels', '/chat', '/profile'],
  coach: ['/coach', '/workouts', '/reels', '/chat', '/profile'],
  admin: ['/admin', '/workouts', '/reels', '/chat', '/profile'],
};

function navForRole(role) {
  if (role === 'athlete') return ATHLETE_NAV;
  if (role === 'coach') return COACH_NAV;
  if (role === 'admin') return ADMIN_NAV;
  return [];
}

function roleHomePath(role) {
  if (role === 'athlete') return '/dashboard';
  if (role === 'coach') return '/coach';
  if (role === 'admin') return '/admin';
  return '/';
}

function mobileTabs(role, items) {
  const paths = MOBILE_TAB_PATHS[role] || [];
  const tabs = paths
    .map((path) => items.find((item) => item.to === path))
    .filter(Boolean);
  tabs.push({ to: '/profile', label: 'Profile', mobileLabel: 'You', icon: 'user' });
  return tabs;
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h6l-1 5h5l-7 11 1-7H4l1-9z"
        fill="url(#ffg)"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="ffg" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#ffd478" />
          <stop offset="100%" stopColor="#d4922a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const items = navForRole(user?.role);
  const home = roleHomePath(user?.role);
  const tabs = mobileTabs(user?.role, items);
  const tabPaths = new Set(tabs.map((t) => t.to));
  const moreItems = items.filter((item) => !tabPaths.has(item.to));

  const roleBadgeClass =
    user?.role === 'coach'
      ? 'badge-coach'
      : user?.role === 'admin'
        ? 'badge-admin'
        : 'badge-athlete';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={home} className={styles.brand} aria-label="FightForge home">
            <BrandMark />
            <span>FightForge</span>
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.menuBar} data-state={open ? 'open' : 'closed'} />
            <span className={styles.menuBar} data-state={open ? 'open' : 'closed'} />
            <span className={styles.menuBar} data-state={open ? 'open' : 'closed'} />
          </button>

          <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label="Main">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                end={item.to === home}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.userMenu}>
            <Link to="/profile" className={styles.userTrigger} title="View profile">
              <div className={styles.userInfo}>
                <span className={styles.userName} title={user?.full_name}>
                  {user?.full_name}
                </span>
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${roleBadgeClass}`}>{user?.role}</span>
                  {user?.overall != null && (
                    <span
                      className="badge"
                      title={`Overall ${user.overall} \u2014 ${Number(user.xp || 0).toLocaleString()} XP`}
                      style={{
                        background: 'linear-gradient(135deg, #2a1f0d, #15110a)',
                        borderColor: 'rgba(244, 185, 66, 0.4)',
                        color: '#fde68a',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      OVR {user.overall}
                    </span>
                  )}
                </span>
              </div>
              <Avatar user={user} size={34} />
            </Link>
            <button type="button" className={styles.logout} onClick={logout} title="Log out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden-sm">Log out</span>
            </button>
          </div>

          {moreItems.length > 0 && open ? (
            <nav className={styles.moreNav} aria-label="More">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Primary">
        {tabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
            }
            end={item.to === home || item.to === '/profile'}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.mobileLabel || item.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className={styles.footer}>
        <span>FightForge</span>
        <span className="dim">v1.0</span>
      </footer>
    </div>
  );
}

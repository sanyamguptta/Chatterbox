import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.scss';

const navItems = [
  { to: '/feed',     icon: '📰', label: 'Feed' },
  { to: '/channels', icon: '💬', label: 'Channels' },
  { to: '/roadmap',  icon: '🗺️', label: 'Roadmap' },
  { to: '/jobs',     icon: '💼', label: 'Jobs' },
  { to: '/alumni',   icon: '🎓', label: 'Alumni' },
  { to: '/profile',  icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon} aria-hidden="true">🛡️</span>
            <span className={styles.label}>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.collegeBadge}>
          <span className={styles.dot} />
          <span>{import.meta.env.VITE_COLLEGE_NAME || 'CGC'}</span>
        </div>
      </div>
    </aside>
  );
}

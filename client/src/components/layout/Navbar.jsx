import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../ui/Avatar';
import ThemeSelector from './ThemeSelector';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    disconnect(); // close real-time connection before clearing auth state
    await logout();
    navigate('/auth');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => navigate('/feed')}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>Chatterbox</span>
        </div>

        {/* Right section */}
        {user && (
          <div className={styles.right}>
            <ThemeSelector />
            <div className={styles.userInfo}>
              <Avatar name={user.display_name} src={user.avatar_url} size="sm" />
              <span className={styles.userName}>{user.display_name}</span>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Log out"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import { getInitials } from '../../utils/validators';
import styles from './Avatar.module.scss';

/**
 * Avatar component — shows image or initials fallback
 * @param {number} size - 'sm' | 'md' | 'lg' | 'xl'
 */
export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={`${styles.avatar} ${styles[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles.fallback} ${styles[size]} ${className}`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

import styles from './Badge.module.scss';

/**
 * Badge component for tags and status indicators
 * @param {string} variant - 'default' | 'accent' | 'success' | 'warning' | 'error'
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

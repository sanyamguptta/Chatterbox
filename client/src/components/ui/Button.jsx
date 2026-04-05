import styles from './Button.module.scss';

/**
 * Button component
 * @param {string} variant - 'primary' | 'outline' | 'ghost' | 'danger'
 * @param {string} size    - 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span>Loading…</span>
        </>
      ) : children}
    </button>
  );
}

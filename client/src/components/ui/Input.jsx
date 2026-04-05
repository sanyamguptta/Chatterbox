import styles from './Input.module.scss';

/**
 * Input component with label and error state
 */
export default function Input({
  label,
  error,
  hint,
  id,
  type = 'text',
  className = '',
  ...rest
}) {
  return (
    <div className={`${styles.field} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.hasError : ''}`}
        {...rest}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

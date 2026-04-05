import { useState, useEffect } from 'react';
import styles from './ThemeSelector.module.scss';

const THEMES = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'dark-grey', label: 'Dark Grey', icon: '🌑' },
];

export default function ThemeSelector() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('chatterbox_theme') || 'light';
  });
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chatterbox_theme', theme);
  }, [theme]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div className={styles.container}>
      <button 
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Change theme"
      >
        <span className={styles.icon}>{currentTheme.icon}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`${styles.item} ${theme === t.id ? styles.active : ''}`}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
              >
                <span className={styles.itemIcon}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

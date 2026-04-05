import styles from './ChannelList.module.scss';

export default function ChannelList({ channels, selectedId, onSelect }) {
  return (
    <aside className={styles.list}>
      <h3 className={styles.heading}>Channels</h3>
      {channels.map(ch => (
        <button
          key={ch.id}
          className={`${styles.item} ${ch.id === selectedId ? styles.active : ''}`}
          onClick={() => onSelect(ch)}
        >
          <span className={styles.hash}>#</span>
          <div className={styles.info}>
            <span className={styles.name}>{ch.name}</span>
            <span className={styles.desc}>{ch.description}</span>
          </div>
        </button>
      ))}
    </aside>
  );
}

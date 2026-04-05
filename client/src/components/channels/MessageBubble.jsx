import Avatar from '../ui/Avatar';
import { timeAgo } from '../../utils/validators';
import styles from './MessageBubble.module.scss';
import { useAuth } from '../../hooks/useAuth';

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isOwn = user?.id === Number(message.user_id);

  return (
    <div className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <Avatar name={message.display_name} src={message.avatar_url} size="sm" />
      )}
      <div className={styles.body}>
        {!isOwn && (
          <span className={styles.sender}>{message.display_name}</span>
        )}
        <div className={`${styles.content} ${isOwn ? styles.ownContent : ''}`}>
          {message.content}
        </div>
        <span className={styles.time}>{timeAgo(message.created_at)}</span>
      </div>
    </div>
  );
}

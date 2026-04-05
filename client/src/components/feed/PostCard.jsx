import { useState } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { timeAgo, getFullImageUrl } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import styles from './PostCard.module.scss';

export default function PostCard({ post, onDelete, onCommentOpen }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(Number(post.like_count));
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);

    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked);
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    } finally {
      setLiking(false);
    }
  };

  const isOwner = user?.id === Number(post.user_id);

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <Avatar name={post.display_name} src={getFullImageUrl(post.avatar_url)} size="md" />
        <div className={styles.meta}>
          <span className={styles.name}>{post.display_name}</span>
          <div className={styles.metaRow}>
            <Badge variant="default">{post.branch} · Year {post.year}</Badge>
            <span className={styles.time}>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {isOwner && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete && onDelete(post.id)}
            title="Delete post"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.text}>{post.content}</p>
        {post.image_url && (
          <img
            src={getFullImageUrl(post.image_url)}
            alt="Post attachment"
            className={styles.image}
          />
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className={styles.tags}>
          {post.tags.map(tag => (
            <Badge key={tag} variant="accent">#{tag}</Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          onClick={handleLike}
          disabled={liking}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onCommentOpen && onCommentOpen(post.id)}
          aria-label="View comments"
        >
          <span>💬</span>
          <span>{Number(post.comment_count) || 0}</span>
        </button>
      </div>
    </article>
  );
}

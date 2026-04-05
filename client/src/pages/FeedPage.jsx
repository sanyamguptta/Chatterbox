import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import Button from '../components/ui/Button';
import api from '../api/axios';
import styles from './FeedPage.module.scss';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const res = await api.get(`/posts?page=${pageNum}`);
      if (append) {
        setPosts(prev => [...prev, ...res.data.posts]);
      } else {
        setPosts(res.data.posts);
      }
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openComments = async (postId) => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setSelectedPost(res.data.post);
      setComments(res.data.comments);
    } catch {
      alert('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/posts/${selectedPost.id}/comments`, { content: commentText });
      setComments(prev => [...prev, res.data.comment]);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.feed}>
          <h1 className={styles.heading}>Developer Feed</h1>

          <CreatePost onPostCreated={handlePostCreated} />

          {loading ? (
            <div className={styles.loadingState}>
              {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : posts.length === 0 ? (
            <div className={styles.empty}>
              <p>No posts yet. Be the first to share something! 🚀</p>
            </div>
          ) : (
            <div className={styles.postList}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                  onCommentOpen={openComments}
                />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <div className={styles.loadMore}>
              <Button
                variant="outline"
                onClick={() => fetchPosts(page + 1, true)}
                loading={loadingMore}
              >
                Load more posts
              </Button>
            </div>
          )}
        </div>

        {/* Comment drawer */}
        {selectedPost && (
          <div className={styles.commentOverlay} onClick={() => setSelectedPost(null)}>
            <div className={styles.commentPanel} onClick={e => e.stopPropagation()}>
              <div className={styles.panelHeader}>
                <h3>Comments</h3>
                <button className={styles.closeBtn} onClick={() => setSelectedPost(null)}>✕</button>
              </div>
              <div className={styles.postExcerpt}>
                <p>{selectedPost.content.slice(0, 120)}{selectedPost.content.length > 120 ? '…' : ''}</p>
              </div>
              <div className={styles.commentList}>
                {comments.length === 0 ? (
                  <p className={styles.noComments}>No comments yet. Start the discussion!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className={styles.comment}>
                      <strong className={styles.commentAuthor}>{c.display_name}</strong>
                      <p className={styles.commentText}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <form className={styles.commentForm} onSubmit={handleAddComment}>
                <input
                  type="text"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className={styles.commentInput}
                  autoFocus
                />
                <Button type="submit" loading={commentLoading} disabled={!commentText.trim()} size="sm">
                  Post
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

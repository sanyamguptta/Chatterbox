import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Layout from '../components/layout/Layout';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import styles from './FeedPage.module.scss';

export default function FeedPage() {
  const { user } = useAuth();
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
  const pageRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

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

  useLayoutEffect(() => {
    if (!pageRef.current || loading) return undefined;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('[data-feed-card]');

      gsap.fromTo(
        '[data-feed-hero]',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      );

      gsap.fromTo(
        cards,
        { opacity: 0, y: 26, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.08,
          delay: 0.12,
          ease: 'power3.out',
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading, error, posts.length]);

  useEffect(() => {
    if (!selectedPost || !overlayRef.current || !panelRef.current) return undefined;

    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.18, ease: 'power2.out' }
    ).fromTo(
      panelRef.current,
      { opacity: 0, y: 28, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: 'power3.out' },
      0
    );

    return () => tl.kill();
  }, [selectedPost]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const closeComments = () => {
    if (!overlayRef.current || !panelRef.current) {
      setSelectedPost(null);
      return;
    }

    gsap.timeline({
      onComplete: () => setSelectedPost(null),
    })
      .to(panelRef.current, {
        opacity: 0,
        y: 18,
        scale: 0.98,
        duration: 0.22,
        ease: 'power2.in',
      })
      .to(
        overlayRef.current,
        { opacity: 0, duration: 0.18, ease: 'power2.in' },
        0
      );
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
      <div className={styles.page} ref={pageRef}>
        <div className={styles.feed}>
          <section className={styles.hero} data-feed-hero>
            <div>
              <p className={styles.eyebrow}>Home</p>
              <h1 className={styles.heading}>Welcome back, {user?.display_name?.split(' ')[0] || 'builder'}.</h1>
              <p className={styles.subheading}>
                Share progress, ask for feedback, and keep your campus dev circle moving forward.
              </p>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statPill}>
                <strong>{posts.length}</strong>
                <span>posts loaded</span>
              </div>
              <div className={styles.statPill}>
                <strong>{hasMore ? `${page}+` : page}</strong>
                <span>pages explored</span>
              </div>
            </div>
          </section>

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
          <div className={styles.commentOverlay} ref={overlayRef} onClick={closeComments}>
            <div className={styles.commentPanel} ref={panelRef} onClick={e => e.stopPropagation()}>
              <div className={styles.panelHeader}>
                <h3>Comments</h3>
                <button className={styles.closeBtn} onClick={closeComments}>✕</button>
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

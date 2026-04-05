import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PostCard from '../components/feed/PostCard';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({ display_name: user.display_name || '', bio: user.bio || '' });
    // Fetch own posts
    const load = async () => {
      try {
        const res = await api.get(`/posts?page=1`);
        // Filter to own posts for now (a dedicated endpoint can come in v2)
        const mine = res.data.posts.filter(p => p.user_id === user.id);
        setPosts(mine);
      } catch { /* noop */ }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/users/profile', form);
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className={styles.page}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            <Avatar name={user.display_name} src={user.avatar_url} size="xl" />
          </div>

          {!editing ? (
            <div className={styles.info}>
              <h1 className={styles.name}>{user.display_name}</h1>
              <div className={styles.badges}>
                <Badge variant="accent">{user.role}</Badge>
                {user.is_approved && <Badge variant="success">Approved</Badge>}
              </div>
              <p className={styles.bio}>{user.bio || 'No bio yet.'}</p>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            </div>
          ) : (
            <form className={styles.editForm} onSubmit={handleSave}>
              <Input
                id="display_name"
                label="Display name"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              />
              <div className={styles.bioField}>
                <label className={styles.bioLabel} htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  className={styles.bioTextarea}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  maxLength={200}
                  placeholder="Tell other devs about yourself…"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.editActions}>
                <Button type="submit" loading={saving} size="sm">Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} type="button">Cancel</Button>
              </div>
            </form>
          )}
        </div>

        {/* Posts grid */}
        <div className={styles.postsSection}>
          <h2 className={styles.postsHeading}>My Posts</h2>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : posts.length === 0 ? (
            <p className={styles.muted}>You haven't posted anything yet.</p>
          ) : (
            <div className={styles.postList}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useState, useRef } from 'react';
import Button from '../ui/Button';
import api from '../../api/axios';
import styles from './CreatePost.module.scss';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('tags', tags);
    if (image) formData.append('image', image);

    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setContent('');
      setTags('');
      setImage(null);
      setImagePreview(null);
      onPostCreated && onPostCreated(res.data.post);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.card} data-feed-card onSubmit={handleSubmit} encType="multipart/form-data">
      <textarea
        className={styles.textarea}
        placeholder="What are you building? Share a project, tip, or question…"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
      />

      {imagePreview && (
        <div className={styles.preview}>
          <img src={imagePreview} alt="Preview" />
          <button
            type="button"
            className={styles.removeImg}
            onClick={() => { setImage(null); setImagePreview(null); }}
          >
            ✕
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.footer}>
        <input
          type="text"
          placeholder="Tags: react, python, dsa (comma-separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className={styles.tagsInput}
        />

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.attachBtn}
            onClick={() => fileRef.current?.click()}
            title="Attach image"
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handleImageChange}
          />
          <Button type="submit" loading={loading} disabled={!content.trim()} size="sm">
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}

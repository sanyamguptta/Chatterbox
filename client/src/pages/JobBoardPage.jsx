import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { timeAgo } from '../utils/validators';
import { useAuth } from '../hooks/useAuth';
import styles from './JobBoardPage.module.scss';
import ReactModal from 'react-modal';

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    type: 'Internship',
    location: '',
    description: '',
    apply_link: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.type) {
      alert('Title, company, and type are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/jobs', formData);
      const newJob = {
        ...res.data.job,
        author_name: user.displayName,
        author_avatar: user.avatarUrl
      };
      setJobs([newJob, ...jobs]);
      setIsModalOpen(false);
      setFormData({
        title: '', company: '', type: 'Internship', location: '', description: '', apply_link: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this posting?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>Internships & Jobs</h1>
            <p className={styles.subhead}>Find opportunities or share open roles at your company.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>Post Opportunity</Button>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading opportunities...</p>
        ) : jobs.length === 0 ? (
          <div className={styles.empty}>
            <span>💼</span>
            <p>No opportunities posted yet. Be the first!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {jobs.map(job => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.metaInfo}>
                    <Avatar src={job.author_avatar} name={job.author_name} size="sm" />
                    <span>Posted by {job.author_name} • {timeAgo(job.created_at)}</span>
                  </div>
                  {(job.user_id === user?.id || user?.role === 'admin') && (
                    <button className={styles.deleteBtn} onClick={() => handleDelete(job.id)}>
                      &times;
                    </button>
                  )}
                </div>
                
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <div className={styles.jobCompany}>{job.company}</div>
                
                <div className={styles.tags}>
                  <Badge variant={job.type === 'Internship' ? 'warning' : 'success'}>
                    {job.type}
                  </Badge>
                  {job.location && <Badge variant="default">📍 {job.location}</Badge>}
                </div>

                {job.description && (
                  <p className={styles.description}>{job.description}</p>
                )}

                {job.apply_link && (
                  <a href={job.apply_link.startsWith('http') ? job.apply_link : `https://${job.apply_link}`} 
                     target="_blank" rel="noreferrer" 
                     className={styles.applyBtn}>
                    Apply Now
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <ReactModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className={styles.modal}
          overlayClassName={styles.overlay}
          ariaHideApp={false}
        >
          <div className={styles.modalHeader}>
            <h3>Post an Opportunity</h3>
            <button className={styles.closeModal} onClick={() => setIsModalOpen(false)}>&times;</button>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input 
              type="text" 
              placeholder="Role Title (e.g. Frontend Intern)" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
              className={styles.input}
            />
            <input 
              type="text" 
              placeholder="Company Name" 
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              required
              className={styles.input}
            />
            <div className={styles.row}>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className={styles.input}
              >
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
              <input 
                type="text" 
                placeholder="Location (e.g. Remote, Bangalore)" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className={styles.input}
              />
            </div>
            <textarea 
              placeholder="Brief description of the role or referral details..." 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className={styles.textarea}
              rows="4"
            />
            <input 
              type="text" 
              placeholder="Application Link (optional)" 
              value={formData.apply_link}
              onChange={e => setFormData({...formData, apply_link: e.target.value})}
              className={styles.input}
            />
            <Button type="submit" loading={submitting}>Post Job</Button>
          </form>
        </ReactModal>
      </div>
    </Layout>
  );
}

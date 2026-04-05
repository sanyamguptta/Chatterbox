import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import styles from './AlumniDirectoryPage.module.scss';
import ReactModal from 'react-modal';

export default function AlumniDirectoryPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const res = await api.get('/mentorship/alumni');
      setAlumni(res.data.alumni);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (alum) => {
    setSelectedAlumni(alum);
    setRequestMessage(`Hi ${alum.display_name.split(' ')[0]}, I'm interested in connecting with you for mentorship regarding `);
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestMessage.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/mentorship/requests', {
        alumniId: selectedAlumni.id,
        message: requestMessage
      });
      alert('Mentorship request sent successfully!');
      setIsModalOpen(false);
      setRequestMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>Alumni Directory</h1>
            <p className={styles.subhead}>Connect with graduated students for mentorship and guidance.</p>
          </div>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading directory...</p>
        ) : alumni.length === 0 ? (
          <div className={styles.empty}>
            <span>🎓</span>
            <p>No alumni registered yet.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {alumni.map(alum => (
              <div key={alum.id} className={styles.alumCard}>
                <div className={styles.alumHeader}>
                  <Avatar src={alum.avatar_url} name={alum.display_name} size="lg" />
                  <div>
                    <h3 className={styles.name}>{alum.display_name}</h3>
                    <Badge variant="default">{alum.branch} Graduate</Badge>
                  </div>
                </div>
                <p className={styles.bio}>{alum.bio || 'No bio provided.'}</p>
                <div className={styles.actions}>
                  <Button onClick={() => handleRequestClick(alum)}>Request Mentorship</Button>
                </div>
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
            <h3>Request Mentorship</h3>
            <button className={styles.closeModal} onClick={() => setIsModalOpen(false)}>&times;</button>
          </div>
          {selectedAlumni && (
            <div className={styles.modalSubhead}>
              Sending request to <strong>{selectedAlumni.display_name}</strong>
            </div>
          )}
          <form onSubmit={handleSubmitRequest} className={styles.form}>
            <textarea
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              className={styles.textarea}
              rows="5"
              required
              placeholder="Introduce yourself and explain what you'd like guidance on..."
            />
            <Button type="submit" loading={submitting}>Send Request</Button>
          </form>
        </ReactModal>
      </div>
    </Layout>
  );
}

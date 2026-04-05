import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { timeAgo } from '../utils/validators';
import styles from './AdminPage.module.scss';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending'); // 'pending' | 'students' | 'add'
  const [pending, setPending] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', roll_no: '', branch: '', year: '1' });

  // Guard — only admins should see this page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/feed');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'pending') {
        const res = await api.get('/admin/pending');
        setPending(res.data.users);
      } else {
        const res = await api.get('/admin/students');
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/approve/${userId}`);
      setPending(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject and delete this account?')) return;
    setActionLoading(userId);
    try {
      await api.post(`/admin/reject/${userId}`);
      setPending(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>Admin Panel</h1>
            <p className={styles.subhead}>Manage student accounts and approvals</p>
          </div>
          <Badge variant="error">Admin Only</Badge>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'pending' ? styles.activeTab : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending Approvals
            {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${tab === 'students' ? styles.activeTab : ''}`}
            onClick={() => setTab('students')}
          >
            All Students
          </button>
          <button
            className={`${styles.tab} ${tab === 'add' ? styles.activeTab : ''}`}
            onClick={() => setTab('add')}
          >
            Add New User
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <div className={styles.empty}>
              <span>✅</span>
              <p>No pending approvals. All caught up!</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roll No</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Applied</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(u => (
                    <tr key={u.id}>
                      <td className={styles.nameCell}>{u.display_name || u.name}</td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td><code>{u.roll_no}</code></td>
                      <td>{u.branch}</td>
                      <td>Year {u.year}</td>
                      <td className={styles.timeCell}>{timeAgo(u.created_at)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(u.id)}
                            loading={actionLoading === u.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(u.id)}
                            loading={actionLoading === u.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'students' ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.roll_no}</code></td>
                    <td>{s.name}</td>
                    <td className={styles.emailCell}>{s.email}</td>
                    <td>
                      {s.is_registered ? (
                        s.is_approved ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )
                      ) : (
                        <Badge variant="default">Not registered</Badge>
                      )}
                    </td>
                    <td>
                      {s.is_registered && s.user_id ? (
                        <select 
                          value={s.role || 'student'} 
                          onChange={async (e) => {
                            try {
                              setActionLoading(s.user_id);
                              await api.put(`/admin/role/${s.user_id}`, { role: e.target.value });
                              fetchData();
                            } catch (err) {
                              alert(err.response?.data?.message || 'Failed to update role');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === s.user_id}
                          className={styles.roleSelect}
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      ) : (
                        <span className={styles.textLight}>-</span>
                      )}
                    </td>
                    <td>
                      {s.is_registered && s.user_id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (!window.confirm('Delete this user?')) return;
                            setActionLoading(s.user_id);
                            try {
                              await api.post(`/admin/reject/${s.user_id}`);
                              fetchData();
                            } catch (err) {
                              alert(err.response?.data?.message || 'Failed to delete user');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          loading={actionLoading === s.user_id}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'add' ? (
          <div className={styles.tableWrap} style={{ padding: '24px' }}>
            <h2 className={styles.heading} style={{ marginBottom: '16px' }}>Add to User Database</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionLoading('add');
              try {
                await api.post('/admin/add-student', formData);
                alert('User added successfully! They can now register.');
                setFormData({ name: '', email: '', roll_no: '', branch: '', year: '1' });
              } catch(err) {
                alert(err.response?.data?.message || 'Failed to add user');
              } finally {
                setActionLoading(null);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={styles.roleSelect} style={{ width: '100%', padding: '8px' }} />
              <input type="email" placeholder="College Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={styles.roleSelect} style={{ width: '100%', padding: '8px' }} />
              <input type="text" placeholder="Roll No (e.g. 2320101, or ALUMNI123)" required value={formData.roll_no} onChange={e => setFormData({...formData, roll_no: e.target.value})} className={styles.roleSelect} style={{ width: '100%', padding: '8px' }} />
              <input type="text" placeholder="Branch (e.g. CSE)" required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className={styles.roleSelect} style={{ width: '100%', padding: '8px' }} />
              <select required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className={styles.roleSelect} style={{ width: '100%', padding: '8px' }}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Alumni (Year 5)</option>
              </select>
              <Button type="submit" loading={actionLoading === 'add'}>Add Record</Button>
            </form>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

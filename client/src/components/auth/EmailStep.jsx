import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { isValidCollegeEmail } from '../../utils/validators';
import api from '../../api/axios';
import styles from './AuthSteps.module.scss';

export default function EmailStep({ onNext, purpose = 'signup' }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const domain = import.meta.env.VITE_COLLEGE_DOMAIN || 'cgc.edu.in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidCollegeEmail(email)) {
      setError(`Email must end with @${domain}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email, purpose });
      onNext({ email });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>Step 1 of 4</span>
        <h2 className={styles.stepTitle}>Enter your college email</h2>
        <p className={styles.stepDesc}>
          Only <strong>@{domain}</strong> addresses are accepted.
        </p>
      </div>

      <Input
        id="email"
        type="email"
        label="College email"
        placeholder={`you@${domain}`}
        value={email}
        onChange={e => setEmail(e.target.value.trim())}
        error={error}
        required
        autoFocus
        autoComplete="email"
      />

      <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
        Send OTP →
      </Button>
    </form>
  );
}

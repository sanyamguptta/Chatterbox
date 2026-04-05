import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import api from '../../api/axios';
import styles from './AuthSteps.module.scss';

export default function PasswordStep({
  email,
  rollNo,
  otpVerifiedToken,
  studentInfo,
  onSuccess,
  onBack,
}) {
  const [form, setForm] = useState({ displayName: studentInfo?.name || '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.displayName.trim()) errs.displayName = 'Display name is required';
    if (form.password.length < 8)  errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email,
        rollNo,
        password: form.password,
        displayName: form.displayName,
        otpVerifiedToken,
      });
      onSuccess();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>Step 4 of 4</span>
        <h2 className={styles.stepTitle}>Set up your account</h2>
        {studentInfo && (
          <div className={styles.studentConfirm}>
            ✅ Verified: <strong>{studentInfo.name}</strong> · {studentInfo.branch} Year {studentInfo.year}
          </div>
        )}
      </div>

      <Input
        id="displayName"
        label="Display name"
        placeholder="How you appear to others"
        value={form.displayName}
        onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        error={errors.displayName}
        autoFocus
      />

      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        error={errors.password}
        autoComplete="new-password"
      />

      <Input
        id="confirm"
        type="password"
        label="Confirm password"
        placeholder="Repeat your password"
        value={form.confirm}
        onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
        error={errors.confirm}
        autoComplete="new-password"
      />

      {apiError && <p className={styles.errorMsg} role="alert">{apiError}</p>}

      <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
        Create account →
      </Button>

      {onBack && (
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Go back
        </button>
      )}
    </form>
  );
}

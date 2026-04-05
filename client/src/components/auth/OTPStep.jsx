import { useState, useRef } from 'react';
import Button from '../ui/Button';
import api from '../../api/axios';
import styles from './AuthSteps.module.scss';

export default function OTPStep({ email, purpose, onNext, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-advance to next field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code, purpose });
      if (purpose === 'login') {
        onNext(res.data); // login returns accessToken + user directly
      } else {
        onNext({ otpVerifiedToken: res.data.otpVerifiedToken });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>{purpose === 'login' ? 'Login' : 'Step 2 of 4'}</span>
        <h2 className={styles.stepTitle}>Enter your OTP</h2>
        <p className={styles.stepDesc}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <div className={styles.otpRow} onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`${styles.otpInput} ${error ? styles.otpError : ''}`}
            aria-label={`OTP digit ${i + 1}`}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
        Verify OTP →
      </Button>

      {onBack && (
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Go back
        </button>
      )}
    </form>
  );
}

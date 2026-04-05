import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import EmailStep from '../components/auth/EmailStep';
import OTPStep from '../components/auth/OTPStep';
import ScanStep from '../components/auth/ScanStep';
import PasswordStep from '../components/auth/PasswordStep';
import ThemeSelector from '../components/layout/ThemeSelector';
import styles from './AuthPage.module.scss';

// Steps for signup flow
const STEPS = ['email', 'otp', 'scan', 'password'];
// Login flow: just email → otp
const LOGIN_STEPS = ['email', 'otp-login'];

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    email: '',
    otpVerifiedToken: '',
    rollNo: '',
    studentInfo: null,
  });
  const [done, setDone] = useState(false); // registration success

  const signupSteps = STEPS;
  const currentSteps = mode === 'login' ? LOGIN_STEPS : signupSteps;
  const currentStep = currentSteps[step];

  const progress = Math.round(((step) / (currentSteps.length)) * 100);

  const handleNext = (newData) => {
    setData(prev => ({ ...prev, ...newData }));
    setStep(s => s + 1);
  };

  const handleLoginComplete = (authData) => {
    // authData = { accessToken, user }
    login(authData.accessToken, authData.user);
    navigate('/feed');
  };

  const handleRegistrationDone = () => {
    setDone(true);
  };

  if (done) {
    return (
      <div className={styles.page}>
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <ThemeSelector />
        </div>
        <div className={styles.card}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Account created!</h2>
          <p className={styles.successDesc}>
            Your account is pending admin approval. You'll receive an email once approved — usually within 24 hours.
          </p>
          <button className={styles.switchBtn} onClick={() => { setMode('login'); setStep(0); setDone(false); }}>
            Go to login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <ThemeSelector />
      </div>
      <div className={styles.card}>
        {/* Brand header */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⚡</span>
          <h1 className={styles.brandName}>Chatterbox</h1>
          <p className={styles.brandTag}>
            {import.meta.env.VITE_COLLEGE_NAME || 'College'} · Developer Community
          </p>
        </div>

        {/* Mode switch */}
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === 'signup' ? styles.activeTab : ''}`}
            onClick={() => { setMode('signup'); setStep(0); }}
          >
            Sign up
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setMode('login'); setStep(0); }}
          >
            Log in
          </button>
        </div>

        {/* Progress bar (signup only) */}
        {mode === 'signup' && step > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Steps */}
        <div className={styles.stepArea}>
          {currentStep === 'email' && (
            <EmailStep onNext={handleNext} purpose={mode} />
          )}
          {currentStep === 'otp' && (
            <OTPStep
              email={data.email}
              purpose="signup"
              onNext={handleNext}
              onBack={() => setStep(0)}
            />
          )}
          {currentStep === 'scan' && (
            <ScanStep
              email={data.email}
              otpVerifiedToken={data.otpVerifiedToken}
              onNext={handleNext}
              onBack={() => setStep(1)}
            />
          )}
          {currentStep === 'password' && (
            <PasswordStep
              email={data.email}
              rollNo={data.rollNo}
              otpVerifiedToken={data.otpVerifiedToken}
              studentInfo={data.studentInfo}
              onSuccess={handleRegistrationDone}
              onBack={() => setStep(2)}
            />
          )}
          {currentStep === 'otp-login' && (
            <OTPStep
              email={data.email}
              purpose="login"
              onNext={handleLoginComplete}
              onBack={() => setStep(0)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

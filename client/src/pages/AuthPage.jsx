import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
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
  const pageRef = useRef(null);
  const shellRef = useRef(null);
  const cardRef = useRef(null);
  const themeRef = useRef(null);
  const progressBarRef = useRef(null);

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
  const panelKey = done ? 'success' : `${mode}-${currentStep}`;

  const progress = Math.round(((step) / (currentSteps.length)) * 100);

  useLayoutEffect(() => {
    if (!pageRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.set('[data-auth-orb]', { transformOrigin: 'center center' });

      gsap.fromTo(
        '[data-auth-orb]',
        { opacity: 0, scale: 0.75 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );

      gsap.fromTo(
        shellRef.current?.children || [],
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.14,
          ease: 'power3.out',
        }
      );

      gsap.fromTo(
        themeRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.45, delay: 0.15, ease: 'power2.out' }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (!cardRef.current) return undefined;

    const ctx = gsap.context(() => {
      const panel = cardRef.current.querySelector('[data-auth-panel]');
      const panelChildren = panel?.children ? Array.from(panel.children) : [];

      gsap.fromTo(
        panel,
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }
      );

      gsap.fromTo(
        panelChildren,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.08,
          ease: 'power2.out',
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [panelKey]);

  useLayoutEffect(() => {
    if (!progressBarRef.current || mode !== 'signup') return undefined;
    gsap.to(progressBarRef.current, {
      width: `${progress}%`,
      duration: 0.45,
      ease: 'power2.out',
    });
    return undefined;
  }, [progress, mode]);

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
      <div className={styles.page} ref={pageRef}>
        <div className={styles.bgMesh} aria-hidden="true">
          <span className={`${styles.orb} ${styles.orbOne}`} data-auth-orb />
          <span className={`${styles.orb} ${styles.orbTwo}`} data-auth-orb />
          <span className={`${styles.orb} ${styles.orbThree}`} data-auth-orb />
        </div>
        <div className={styles.themeDock} ref={themeRef}>
          <ThemeSelector />
        </div>
        <div className={styles.shell} ref={shellRef}>
          <section className={styles.storyPanel}>
            <div className={styles.storyEyebrow}>Campus network</div>
            <h1 className={styles.storyTitle}>You&apos;re in. We&apos;ll unlock the community as soon as your access is approved.</h1>
            <p className={styles.storyText}>
              While the admin team reviews your request, your account details are safely queued and ready for launch.
            </p>
          </section>

          <div className={styles.card} ref={cardRef}>
            <div className={styles.successPanel} data-auth-panel>
              <div className={styles.successIcon}>🎉</div>
              <h2 className={styles.successTitle}>Account created!</h2>
              <p className={styles.successDesc}>
                Your account is pending admin approval. You&apos;ll receive an email once approved, usually within 24 hours.
              </p>
              <button className={styles.switchBtn} onClick={() => { setMode('login'); setStep(0); setDone(false); }}>
                Go to login →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.bgMesh} aria-hidden="true">
        <span className={`${styles.orb} ${styles.orbOne}`} data-auth-orb />
        <span className={`${styles.orb} ${styles.orbTwo}`} data-auth-orb />
        <span className={`${styles.orb} ${styles.orbThree}`} data-auth-orb />
      </div>
      <div className={styles.themeDock} ref={themeRef}>
        <ThemeSelector />
      </div>
      <div className={styles.shell} ref={shellRef}>
        <section className={styles.storyPanel}>
          <div className={styles.storyEyebrow}>Developer community</div>
          <h1 className={styles.storyTitle}>Build your campus network in one place.</h1>
          <p className={styles.storyText}>
            Join peers, share project updates, discover roles, and keep conversations moving with a calmer, more modern workspace.
          </p>
          <div className={styles.storyStats}>
            <div className={styles.statCard}>
              <strong>Feed</strong>
              <span>Projects, wins, and asks</span>
            </div>
            <div className={styles.statCard}>
              <strong>Channels</strong>
              <span>Focused community discussion</span>
            </div>
            <div className={styles.statCard}>
              <strong>Roadmaps</strong>
              <span>Career growth with direction</span>
            </div>
          </div>
        </section>

        <div className={styles.card} ref={cardRef}>
          <div className={styles.cardGlow} aria-hidden="true" />

          <div className={styles.brand}>
            <span className={styles.brandIcon}>⚡</span>
            <div>
              <h1 className={styles.brandName}>Chatterbox</h1>
              <p className={styles.brandTag}>
                {import.meta.env.VITE_COLLEGE_NAME || 'College'} · Developer Community
              </p>
            </div>
          </div>

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

          {mode === 'signup' && step > 0 && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} ref={progressBarRef} />
            </div>
          )}

          <div className={styles.stepArea} key={panelKey} data-auth-panel>
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
    </div>
  );
}

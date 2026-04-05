import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import api from '../../api/axios';
import styles from './AuthSteps.module.scss';

export default function ScanStep({ email, otpVerifiedToken, onNext, onBack }) {
  const [scanning, setScanning] = useState(false);
  const [manualRoll, setManualRoll] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const scannerRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (!scanning || useManual) return;

    let scanner;

    const initScanner = async () => {
      // Dynamic import because html5-qrcode has side effects
      const { Html5QrcodeScanner } = await import('html5-qrcode');

      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          supportedScanTypes: [0, 1], // both camera and image
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // Success — roll number decoded from barcode
          const roll = decodedText.trim();
          scanner.clear();
          setScanning(false);
          verifyRoll(roll);
        },
        (errorMsg) => {
          // Scan errors are expected (camera pointing at wrong thing)
          // Only log actual errors, not "no QR found" noise
          if (!errorMsg.includes('No MultiFormat')) {
            console.warn('QR scan error:', errorMsg);
          }
        }
      );

      scannerRef.current = scanner;
    };

    initScanner();

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [scanning, useManual]);

  const verifyRoll = async (rollNo) => {
    if (!rollNo || rollNo.length < 4) {
      setError('Invalid roll number. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-roll', {
        email,
        rollNo,
        otpVerifiedToken,
      });
      onNext({ rollNo, studentInfo: res.data.student });
    } catch (err) {
      setError(err.response?.data?.message || 'Roll number verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyRoll(manualRoll.trim());
  };

  return (
    <div className={styles.form}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>Step 3 of 4</span>
        <h2 className={styles.stepTitle}>Verify your ID card</h2>
        <p className={styles.stepDesc}>
          Scan the barcode on your college ID card to confirm your roll number.
        </p>
      </div>

      {!scanning && !useManual ? (
        <div className={styles.scanOptions}>
          <button
            className={styles.scanBtn}
            onClick={() => setScanning(true)}
            type="button"
          >
            <span className={styles.scanIcon}>📷</span>
            <span>Scan ID card barcode</span>
            <span className={styles.scanHint}>Use device camera</span>
          </button>

          <div className={styles.or}><span>or</span></div>

          <button
            className={styles.manualBtn}
            onClick={() => setUseManual(true)}
            type="button"
          >
            Enter roll number manually
          </button>
        </div>
      ) : scanning && !useManual ? (
        <div className={styles.scannerWrap}>
          <div id="qr-reader" ref={qrRef} />
          <button
            className={styles.backBtn}
            onClick={() => { setScanning(false); scannerRef.current?.clear().catch(() => {}); }}
            type="button"
          >
            ← Cancel scan
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className={styles.manualForm}>
          <input
            type="text"
            placeholder="e.g. 2320101"
            value={manualRoll}
            onChange={e => setManualRoll(e.target.value)}
            className={styles.rollInput}
            autoFocus
          />
          <Button type="submit" loading={loading} size="lg" className={styles.submitBtn}>
            Verify Roll Number →
          </Button>
          <button type="button" className={styles.backBtn} onClick={() => setUseManual(false)}>
            ← Back to scan
          </button>
        </form>
      )}

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}
      {loading && <p className={styles.loadingMsg}>Verifying with server…</p>}

      {onBack && !scanning && (
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Go back
        </button>
      )}
    </div>
  );
}

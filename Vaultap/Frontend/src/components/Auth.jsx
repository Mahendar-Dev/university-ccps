import { useState } from 'react';
import { signup, login } from '../api';

// Ye component tab dikhta hai jab user logged-in nahi hai
// mode: 'signup' | 'login' | 'confirm' (account bann jaane ke baad ka message)
export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(username, email, password, referralCode || undefined);
      // Signup ke baad seedha login nahi karte - pehle confirmation dikhate hain
      setMode('confirm');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('vaultap_token', data.token);
      localStorage.setItem('vaultap_username', data.user.username);
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Confirmation screen - account creation ke turant baad
  if (mode === 'confirm') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.confirmIcon}>
            <span style={styles.checkmark}>✓</span>
          </div>
          <h2 style={styles.confirmTitle}>Account created</h2>
          <p style={styles.confirmText}>
            Your vault is ready. Sign in below to start earning.
          </p>
          <button
            style={styles.button}
            onClick={() => { setMode('login'); setPassword(''); }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const isLogin = mode === 'login';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.mark}>
          <div style={styles.markInner} />
        </div>
        <h1 style={styles.title}>Vaultap</h1>
        <p style={styles.subtitle}>Your coins, locked and earning</p>

        <form onSubmit={isLogin ? handleLogin : handleSignup} style={styles.form}>
          {!isLogin && (
            <label style={styles.label}>
              Enter your username
              <input
                style={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                required
              />
            </label>
          )}

          <label style={styles.label}>
            Enter your email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={styles.label}>
            Enter your password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {!isLogin && (
            <label style={styles.label}>
              Enter your referral code (optional)
              <input
                style={styles.input}
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
              />
            </label>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Working…' : isLogin ? 'Unlock vault' : 'Create vault'}
          </button>
        </form>

        <button
          style={styles.toggle}
          onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(''); }}
          type="button"
        >
          {isLogin ? "Don't have a vault? Create one" : 'Already have a vault? Unlock it'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'rgba(18, 22, 31, 0.75)',
    backdropFilter: 'blur(16px)',
    padding: '40px 32px',
    borderRadius: '20px',
    width: '340px',
    border: '1px solid rgba(242, 193, 78, 0.15)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
    textAlign: 'center',
  },
  mark: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(145deg, #262c3a, #1a1f2b)',
    border: '1px solid #F2C14E',
    boxShadow: '0 4px 12px rgba(242,193,78,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  markInner: {
    width: '14px',
    height: '14px',
    borderRadius: '3px',
    background: '#F2C14E',
    boxShadow: '0 0 10px rgba(242,193,78,0.7)',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    color: '#E8E6E0',
    margin: '0 0 6px',
    fontSize: '26px',
    letterSpacing: '-0.02em',
  },
  subtitle: { color: '#5A6270', margin: '0 0 28px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#5A6270' },
  input: {
    padding: '11px 12px',
    borderRadius: '10px',
    border: '1px solid #1E2330',
    background: '#0B0E14',
    color: '#E8E6E0',
    fontSize: '14px',
  },
  button: {
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(145deg, #FFDA7A, #E8AC2E)',
    color: '#0B0E14',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 14px rgba(242,193,78,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
    width: '100%',
  },
  error: { color: '#E2685C', fontSize: '13px', margin: '0' },
  toggle: {
    background: 'none',
    border: 'none',
    color: '#E14F9C',
    fontSize: '13px',
    marginTop: '22px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    padding: 0,
    fontWeight: 600,
  },
  confirmIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0FD584, #0E8F5C)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 8px 24px rgba(15,213,132,0.4)',
    animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  checkmark: { color: '#fff', fontSize: '32px', fontWeight: 700 },
  confirmTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#E8E6E0',
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  confirmText: { color: '#5A6270', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 },
};

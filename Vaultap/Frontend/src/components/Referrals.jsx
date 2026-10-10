import { useState, useEffect, useRef } from 'react';
import { getReferrals } from '../api';

export default function Referrals({ token, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayInvited, setDisplayInvited] = useState(0);
  const [displayEarned, setDisplayEarned] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    getReferrals(token)
      .then((d) => {
        setData(d);
        animateCount(d.totalInvited, Number(d.totalEarned));
      })
      .catch((err) => setError(err.message));
    return () => cancelAnimationFrame(animRef.current);
  }, [token]);

  // Stats ko 0 se target tak smoothly count-up karta hai - "alive" feel dene ke liye
  function animateCount(targetInvited, targetEarned) {
    const duration = 800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayInvited(Math.round(targetInvited * eased));
      setDisplayEarned(Math.round(targetEarned * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(step);
    }
    animRef.current = requestAnimationFrame(step);
  }

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <span style={styles.title}>Referrals</span>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {data && (
          <>
            <div style={styles.codeBox}>
              <p style={styles.codeLabel}>Your referral code</p>
              <div style={styles.codeRow}>
                <span style={styles.code}>{data.referralCode}</span>
                <button style={styles.copyBtn} onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={styles.statsRow}>
              <div style={{ ...styles.statBox, ...styles.statBoxCyan }}>
                <p style={styles.statValue}>{displayInvited}</p>
                <p style={styles.statLabel}>Invited</p>
              </div>
              <div style={{ ...styles.statBox, ...styles.statBoxGold }}>
                <p style={styles.statValue}>{displayEarned}</p>
                <p style={styles.statLabel}>Coins earned</p>
              </div>
            </div>

            <p style={styles.listTitle}>Invited users</p>
            <div style={styles.list}>
              {data.invitedUsers.length === 0 && (
                <p style={styles.empty}>Abhi tak kisi ko invite nahi kiya</p>
              )}
              {data.invitedUsers.map((u, i) => (
                <div key={i} style={styles.userRow}>
                  <span style={styles.username}>{u.username}</span>
                  <span style={styles.joinedAt}>
                    {new Date(u.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card: {
    background: 'rgba(18, 22, 31, 0.75)',
    backdropFilter: 'blur(16px)',
    padding: '24px',
    borderRadius: '20px',
    width: '340px',
    border: '1px solid rgba(225, 79, 156, 0.2)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
  },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  backBtn: { background: 'none', border: 'none', color: '#5A6270', fontSize: '13px', cursor: 'pointer', padding: 0 },
  title: { color: '#E8E6E0', fontSize: '16px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" },
  error: { color: '#E2685C', fontSize: '13px' },
  codeBox: {
    background: '#0B0E14',
    border: '1px solid #1E2330',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '16px',
  },
  codeLabel: { color: '#5A6270', fontSize: '11px', margin: '0 0 6px' },
  codeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: '#F2C14E', fontSize: '18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: '1px' },
  copyBtn: {
    background: 'linear-gradient(135deg, #E14F9C, #B83280)',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(225,79,156,0.3)',
  },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  statBox: {
    flex: 1,
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'center',
    border: '1px solid #1E2330',
  },
  statBoxCyan: { background: 'linear-gradient(160deg, rgba(42,184,230,0.15), #0B0E14)' },
  statBoxGold: { background: 'linear-gradient(160deg, rgba(242,193,78,0.15), #0B0E14)' },
  statValue: { color: '#E8E6E0', fontSize: '20px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, margin: '0 0 2px' },
  statLabel: { color: '#5A6270', fontSize: '11px', margin: 0 },
  listTitle: { color: '#5A6270', fontSize: '11px', margin: '0 0 8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  empty: { color: '#5A6270', fontSize: '12px', textAlign: 'center', padding: '12px 0' },
  userRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: '#0B0E14',
    border: '1px solid #1E2330',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  username: { color: '#E8E6E0', fontSize: '13px' },
  joinedAt: { color: '#5A6270', fontSize: '11px' },
};

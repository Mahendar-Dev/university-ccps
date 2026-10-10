import { useState, useEffect } from 'react';
import { tap, getStatus } from '../api';

export default function Game({ token, username, onLogout, onNavigate, externalBalance }) {
  const [balance, setBalance] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [energyMax, setEnergyMax] = useState(1000);
  const [pop, setPop] = useState(null); // floating "+1" animation
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    getStatus(token).then((data) => {
      setBalance(Number(data.balance));
      setEnergy(data.energy);
      setEnergyMax(data.energyMax);
    }).catch(console.error);
  }, [token]);

  // Agar Quests screen se koi reward claim ho, wahan se balance yahan bhi sync ho jaye
  useEffect(() => {
    if (externalBalance !== undefined && externalBalance !== null) {
      setBalance(externalBalance);
    }
  }, [externalBalance]);

  async function handleTap() {
    if (energy <= 0) return;

    setPop(Date.now());
    setPressed(true);
    setTimeout(() => setPop(null), 500);
    setTimeout(() => setPressed(false), 100);

    try {
      const data = await tap(token);
      setBalance(Number(data.balance));
      setEnergy(data.energy);
    } catch (err) {
      console.error(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('vaultap_token');
    localStorage.removeItem('vaultap_username');
    onLogout();
  }

  const energyPct = energyMax > 0 ? energy / energyMax : 0;
  const circumference = 2 * Math.PI * 92;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.username}>{username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>

        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>Vault balance</span>
          <span style={styles.balanceValue}>{balance.toLocaleString()}</span>
        </div>

        <div style={styles.tapWrap}>
          <svg width="200" height="200" style={styles.ring}>
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2AB8E6" />
                <stop offset="50%" stopColor="#0FD584" />
                <stop offset="100%" stopColor="#F2C14E" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="#1E2330" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="92" fill="none" stroke="url(#ringGrad)" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - energyPct)}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.2s' }}
            />
          </svg>
          <button
            style={{
              ...styles.tapButton,
              opacity: energy <= 0 ? 0.4 : 1,
              transform: pressed ? 'scale(0.93)' : 'scale(1)',
              boxShadow: pressed
                ? '0 4px 10px rgba(0,0,0,0.5), inset 0 2px 6px rgba(0,0,0,0.4)'
                : styles.tapButton.boxShadow,
            }}
            onClick={handleTap}
            disabled={energy <= 0}
            aria-label="Tap to earn a coin"
          >
            Tap
          </button>
          {pop && <span style={styles.pop}>+1</span>}
        </div>

        <p style={styles.energyText}>{energy} / {energyMax} energy</p>

        <div style={styles.navRow}>
          <button style={{ ...styles.navBtn, ...styles.navBtnCyan }} onClick={() => onNavigate('quests')}>Quests</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnPink }} onClick={() => onNavigate('referrals')}>Referrals</button>
          <button style={{ ...styles.navBtn, ...styles.navBtnTeal }} onClick={() => onNavigate('wallet')}>Wallet</button>
        </div>
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
  },
  card: {
    background: 'rgba(18, 22, 31, 0.75)',
    backdropFilter: 'blur(16px)',
    padding: '28px',
    borderRadius: '20px',
    width: '340px',
    border: '1px solid rgba(242, 193, 78, 0.15)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  username: { color: '#E8E6E0', fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif" },
  logoutBtn: {
    background: 'none',
    border: '1px solid #1E2330',
    color: '#5A6270',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  balanceRow: {
    background: 'linear-gradient(180deg, #0D1119, #08090D)',
    borderRadius: '14px',
    padding: '18px',
    textAlign: 'center',
    marginBottom: '28px',
    border: '1px solid #1E2330',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
  },
  balanceLabel: { display: 'block', color: '#5A6270', fontSize: '12px', marginBottom: '6px' },
  balanceValue: {
    display: 'block',
    color: '#F2C14E',
    fontSize: '32px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
  },
  tapWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    width: '200px',
    height: '200px',
  },
  ring: { position: 'absolute', top: 0, left: 0 },
  tapButton: {
    width: '156px',
    height: '156px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #2A3140, #171B24)',
    border: '2px solid #F2C14E',
    color: '#F2C14E',
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(0,0,0,0.5), 0 0 24px rgba(242,193,78,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
  },
  pop: {
    position: 'absolute',
    top: '20%',
    color: '#F2C14E',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '18px',
    fontWeight: 600,
    animation: 'floatUp 0.5s ease-out forwards',
    pointerEvents: 'none',
  },
  energyText: { color: '#5A6270', fontSize: '12px', textAlign: 'center', margin: '0 0 20px' },
  navRow: { display: 'flex', gap: '8px' },
  navBtn: {
    flex: 1,
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    padding: '11px 4px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  navBtnCyan: {
    background: 'linear-gradient(135deg, #2AB8E6, #1E5FDB)',
    boxShadow: '0 4px 14px rgba(42,184,230,0.35)',
  },
  navBtnPink: {
    background: 'linear-gradient(135deg, #E14F9C, #B83280)',
    boxShadow: '0 4px 14px rgba(225,79,156,0.35)',
  },
  navBtnTeal: {
    background: 'linear-gradient(135deg, #0FD584, #0E8F5C)',
    boxShadow: '0 4px 14px rgba(15,213,132,0.35)',
  },
};

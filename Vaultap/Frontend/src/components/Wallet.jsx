import { useState, useEffect } from 'react';
import { connectWallet, getWalletStatus } from '../api';
import { connectMetaMask } from '../walletProvider';

// Wallet ka "home" screen - connect status, balances, aur Convert/Withdraw ke liye
// alag navigation cards (jaise Quests/Referrals apna alag screen hai)
export default function Wallet({ token, onBack, onNavigate }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    getWalletStatus(token).then(setStatus).catch((err) => setError(err.message));
  }

  async function handleConnectWallet() {
    setError('');
    setMessage('');
    setConnecting(true);
    try {
      const address = await connectMetaMask();
      await connectWallet(token, address);
      loadStatus();
      setMessage('Wallet connected');
    } catch (err) {
      setError(err.message || 'Wallet connect fail ho gaya');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <span style={styles.title}>Wallet</span>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        {status && (
          <>
            <div style={styles.section}>
              {status.walletAddress ? (
                <div style={styles.walletBox}>
                  <span style={styles.walletLabel}>Connected wallet</span>
                  <span style={styles.walletAddr}>
                    {status.walletAddress.slice(0, 6)}...{status.walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <>
                  <p style={styles.connectTitle}>Connect your wallet</p>
                  <button style={styles.connectBtn} onClick={handleConnectWallet} disabled={connecting}>
                    {connecting ? 'Opening MetaMask...' : 'Connect MetaMask'}
                  </button>
                  <button
                    style={styles.connectBtnAlt}
                    onClick={() => setError('Support for other wallets is coming soon')}
                  >
                    Connect another wallet
                  </button>
                </>
              )}
            </div>

            <div style={styles.statsRow}>
              <div style={{ ...styles.statBox, ...styles.statBoxGold }}>
                <p style={styles.statValue}>{Number(status.coinBalance).toLocaleString()}</p>
                <p style={styles.statLabel}>Coins</p>
              </div>
              <div style={{ ...styles.statBox, ...styles.statBoxTeal }}>
                <p style={styles.statValue}>{Number(status.usdtBalance).toFixed(4)}</p>
                <p style={styles.statLabel}>USDT</p>
              </div>
            </div>

            <div style={styles.navList}>
              <button style={{ ...styles.navCard, ...styles.navCardCyan }} onClick={() => onNavigate('convert')}>
                <span style={styles.navCardTitle}>Convert coins → USDT</span>
                <span style={styles.navCardArrow}>→</span>
              </button>
              <button style={{ ...styles.navCard, ...styles.navCardPink }} onClick={() => onNavigate('withdraw')}>
                <span style={styles.navCardTitle}>Withdraw USDT</span>
                <span style={styles.navCardArrow}>→</span>
              </button>
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
    border: '1px solid rgba(15, 213, 132, 0.2)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
  },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { background: 'none', border: 'none', color: '#5A6270', fontSize: '13px', cursor: 'pointer', padding: 0 },
  title: { color: '#E8E6E0', fontSize: '16px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" },
  error: { color: '#E2685C', fontSize: '12px', marginBottom: '10px' },
  success: { color: '#1E8F6F', fontSize: '12px', marginBottom: '10px' },
  section: { marginBottom: '16px' },
  connectTitle: { color: '#E8E6E0', fontSize: '13px', fontWeight: 600, margin: '0 0 10px' },
  connectBtn: {
    width: '100%',
    background: 'linear-gradient(145deg, #FFDA7A, #E8AC2E)',
    border: 'none',
    color: '#0B0E14',
    fontSize: '13px',
    fontWeight: 700,
    padding: '11px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: '8px',
  },
  connectBtnAlt: {
    width: '100%',
    background: '#0B0E14',
    border: '1px solid #1E2330',
    color: '#5A6270',
    fontSize: '12px',
    fontWeight: 600,
    padding: '10px',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  walletBox: {
    background: '#0B0E14',
    border: '1px solid #1E2330',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  walletLabel: { color: '#5A6270', fontSize: '11px' },
  walletAddr: { color: '#1E8F6F', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '18px' },
  statBox: { flex: 1, borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #1E2330' },
  statBoxGold: { background: 'linear-gradient(160deg, rgba(242,193,78,0.15), #0B0E14)' },
  statBoxTeal: { background: 'linear-gradient(160deg, rgba(15,213,132,0.15), #0B0E14)' },
  statValue: { color: '#F2C14E', fontSize: '18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, margin: '0 0 2px' },
  statLabel: { color: '#5A6270', fontSize: '11px', margin: 0 },
  navList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    color: '#fff',
  },
  navCardCyan: { background: 'linear-gradient(135deg, #2AB8E6, #1E5FDB)', boxShadow: '0 4px 14px rgba(42,184,230,0.3)' },
  navCardPink: { background: 'linear-gradient(135deg, #E14F9C, #B83280)', boxShadow: '0 4px 14px rgba(225,79,156,0.3)' },
  navCardTitle: { fontSize: '13px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  navCardArrow: { fontSize: '16px', fontWeight: 700 },
};

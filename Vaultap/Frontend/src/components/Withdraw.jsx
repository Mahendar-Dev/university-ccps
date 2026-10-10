import { useState, useEffect } from 'react';
import { getWalletStatus, withdrawUsdt } from '../api';

export default function Withdraw({ token, onBack }) {
  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWalletStatus(token).then(setStatus).catch((err) => setError(err.message));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await withdrawUsdt(token, Number(amount));
      setMessage(`Withdrawal sent: ${data.withdrawal.netAmount} USDT to ${data.withdrawal.toWalletAddress.slice(0, 6)}...${data.withdrawal.toWalletAddress.slice(-4)} (tx: ${data.withdrawal.txHash.slice(0, 10)}...)`);
      setAmount('');
      getWalletStatus(token).then(setStatus).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <span style={styles.title}>Withdraw USDT</span>
        </div>

        {status && (
          <>
            <div style={styles.statBox}>
              <p style={styles.statValue}>{Number(status.usdtBalance).toFixed(4)}</p>
              <p style={styles.statLabel}>Available USDT</p>
            </div>

            <div style={styles.detailsBox}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Withdrawal fee</span>
                <span style={styles.detailValue}>{status.withdrawalFeePercent}%</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Destination</span>
                <span style={styles.detailValue}>
                  {status.walletAddress
                    ? `${status.walletAddress.slice(0, 6)}...${status.walletAddress.slice(-4)}`
                    : 'No wallet connected'}
                </span>
              </div>
            </div>

            {!status.walletAddress && (
              <p style={styles.warning}>Connect your wallet first from the Wallet screen to withdraw.</p>
            )}

            {error && <p style={styles.error}>{error}</p>}
            {message && <p style={styles.success}>{message}</p>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                USDT amount
                <input
                  style={styles.input}
                  type="number"
                  step="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 0.5"
                  disabled={!status.walletAddress}
                  required
                />
              </label>
              {amount > 0 && (
                <p style={styles.preview}>
                  You'll receive ≈ {(Number(amount) * (1 - status.withdrawalFeePercent / 100)).toFixed(6)} USDT after fee
                </p>
              )}
              <button style={styles.submitBtn} type="submit" disabled={loading || !status.walletAddress}>
                {loading ? 'Sending...' : 'Withdraw now'}
              </button>
            </form>
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
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { background: 'none', border: 'none', color: '#5A6270', fontSize: '13px', cursor: 'pointer', padding: 0 },
  title: { color: '#E8E6E0', fontSize: '16px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" },
  statBox: {
    background: 'linear-gradient(160deg, rgba(225,79,156,0.15), #0B0E14)',
    border: '1px solid #1E2330',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
    marginBottom: '14px',
  },
  statValue: { color: '#E14F9C', fontSize: '22px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, margin: '0 0 2px' },
  statLabel: { color: '#5A6270', fontSize: '11px', margin: 0 },
  detailsBox: {
    background: '#0B0E14',
    border: '1px solid #1E2330',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '12px',
  },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  detailLabel: { color: '#5A6270', fontSize: '12px' },
  detailValue: { color: '#E8E6E0', fontSize: '12px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" },
  warning: { color: '#F2C14E', fontSize: '11px', marginBottom: '12px', lineHeight: 1.4 },
  error: { color: '#E2685C', fontSize: '12px', marginBottom: '10px' },
  success: { color: '#0FD584', fontSize: '12px', marginBottom: '10px', wordBreak: 'break-all' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#5A6270' },
  input: {
    padding: '11px 12px',
    borderRadius: '10px',
    border: '1px solid #1E2330',
    background: '#0B0E14',
    color: '#E8E6E0',
    fontSize: '14px',
  },
  preview: { color: '#0FD584', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", margin: 0 },
  submitBtn: {
    background: 'linear-gradient(135deg, #E14F9C, #B83280)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '4px',
    fontFamily: "'Space Grotesk', sans-serif",
    boxShadow: '0 4px 14px rgba(225,79,156,0.3)',
  },
};

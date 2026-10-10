import { useState, useEffect } from 'react';
import { getQuests, claimQuest } from '../api';

export default function Quests({ token, onBack, onBalanceUpdate }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuests();
  }, []);

  function loadQuests() {
    setLoading(true);
    getQuests(token)
      .then((data) => setQuests(data.quests))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleClaim(questId) {
    try {
      const data = await claimQuest(token, questId);
      onBalanceUpdate(Number(data.balance)); // Game screen ki balance bhi update ho jaye
      loadQuests(); // list refresh karo taake naya status dikhe
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <span style={styles.title}>Quests</span>
        </div>

        {loading && <p style={styles.info}>Loading...</p>}
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.list}>
          {quests.map((q) => {
            const isComplete = q.targetValue ? q.progress >= q.targetValue : true;
            const isClaimed = q.status === 'claimed';

            return (
              <div key={q.id} style={styles.questRow}>
                <div style={styles.questInfo}>
                  <div style={styles.titleRow}>
                    <p style={styles.questTitle}>{q.title}</p>
                    <span style={{ ...styles.badge, ...badgeColors[q.type] }}>{q.type}</span>
                  </div>
                  <p style={styles.questDesc}>{q.description}</p>
                  {q.targetValue && (
                    <p style={styles.progress}>{q.progress} / {q.targetValue}</p>
                  )}
                </div>
                <div style={styles.questRight}>
                  <span style={styles.reward}>+{q.rewardAmount}</span>
                  <button
                    style={{
                      ...styles.claimBtn,
                      opacity: isClaimed || !isComplete ? 0.4 : 1,
                      cursor: isClaimed || !isComplete ? 'default' : 'pointer',
                    }}
                    disabled={isClaimed || !isComplete}
                    onClick={() => handleClaim(q.id)}
                  >
                    {isClaimed ? 'Claimed' : isComplete ? 'Claim' : 'Locked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const badgeColors = {
  daily: { background: 'rgba(42,184,230,0.18)', color: '#2AB8E6' },
  milestone: { background: 'rgba(242,193,78,0.18)', color: '#F2C14E' },
  social: { background: 'rgba(225,79,156,0.18)', color: '#E14F9C' },
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card: {
    background: 'rgba(18, 22, 31, 0.75)',
    backdropFilter: 'blur(16px)',
    padding: '24px',
    borderRadius: '20px',
    width: '340px',
    border: '1px solid rgba(42, 184, 230, 0.2)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
  },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  backBtn: { background: 'none', border: 'none', color: '#5A6270', fontSize: '13px', cursor: 'pointer', padding: 0 },
  title: { color: '#E8E6E0', fontSize: '16px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" },
  info: { color: '#5A6270', fontSize: '13px' },
  error: { color: '#E2685C', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  questRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0B0E14',
    border: '1px solid #1E2330',
    borderRadius: '12px',
    padding: '12px 14px',
  },
  questInfo: { flex: 1 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' },
  questTitle: { color: '#E8E6E0', fontSize: '13px', fontWeight: 600, margin: 0 },
  badge: { fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', textTransform: 'uppercase' },
  questDesc: { color: '#5A6270', fontSize: '11px', margin: '0 0 4px' },
  progress: { color: '#1E8F6F', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", margin: 0 },
  questRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  reward: { color: '#F2C14E', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 },
  claimBtn: {
    background: 'linear-gradient(135deg, #0FD584, #0E8F5C)',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '7px 14px',
    borderRadius: '8px',
    boxShadow: '0 3px 10px rgba(15,213,132,0.3)',
  },
};

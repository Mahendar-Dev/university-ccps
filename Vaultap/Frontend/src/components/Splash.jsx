import { useState, useEffect } from 'react';

// App khulte hi ye screen dikhti hai - animated logo + floating feature callouts
// 3.2 second ke baad khud Auth screen pe chala jata hai
export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400); // fade-out complete hone ka wait
    }, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={{ ...styles.container, opacity: visible ? 1 : 0 }}>
      <div style={styles.logoWrap}>
        <div style={styles.logoRing} />
        <div style={styles.logoMark}>
          <div style={styles.logoInner} />
        </div>
      </div>
      <h1 style={styles.title}>Vaultap</h1>
      <p style={styles.subtitle}>Your coins, locked and earning</p>

      <div style={styles.popupStack}>
        <div style={{ ...styles.popup, ...styles.popupGold, animationDelay: '0.4s' }}>
          Tap to earn coins instantly
        </div>
        <div style={{ ...styles.popup, ...styles.popupCyan, animationDelay: '0.9s' }}>
          Complete quests for bonus rewards
        </div>
        <div style={{ ...styles.popup, ...styles.popupPink, animationDelay: '1.4s' }}>
          Invite friends, earn together
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    transition: 'opacity 0.4s ease',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    position: 'relative',
    width: '84px',
    height: '84px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '22px',
    border: '2px solid transparent',
    background: 'linear-gradient(#0B0E14,#0B0E14) padding-box, conic-gradient(from 0deg, #2AB8E6, #0FD584, #F2C14E, #E14F9C, #2AB8E6) border-box',
    animation: 'spinRing 3s linear infinite',
  },
  logoMark: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, #262c3a, #1a1f2b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  logoInner: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    background: '#F2C14E',
    boxShadow: '0 0 16px rgba(242,193,78,0.8)',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '32px',
    color: '#E8E6E0',
    margin: '0 0 6px',
    animation: 'fadeInUp 0.6s ease 0.2s both',
  },
  subtitle: {
    color: '#5A6270',
    fontSize: '14px',
    margin: '0 0 40px',
    animation: 'fadeInUp 0.6s ease 0.3s both',
  },
  popupStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    maxWidth: '300px',
  },
  popup: {
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    animation: 'popupSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
    opacity: 0,
  },
  popupGold: { background: 'linear-gradient(135deg, rgba(242,193,78,0.25), rgba(242,193,78,0.1))', border: '1px solid rgba(242,193,78,0.3)', color: '#F2C14E' },
  popupCyan: { background: 'linear-gradient(135deg, rgba(42,184,230,0.25), rgba(42,184,230,0.1))', border: '1px solid rgba(42,184,230,0.3)', color: '#2AB8E6' },
  popupPink: { background: 'linear-gradient(135deg, rgba(225,79,156,0.25), rgba(225,79,156,0.1))', border: '1px solid rgba(225,79,156,0.3)', color: '#E14F9C' },
};

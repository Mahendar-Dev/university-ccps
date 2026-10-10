// Login successful hone ke baad 2 second ka loading transition
export default function Loading() {
  return (
    <div style={styles.container}>
      <div style={styles.spinnerWrap}>
        <div style={styles.spinnerRing} />
        <div style={styles.spinnerDot} />
      </div>
      <p style={styles.text}>Loading<span style={styles.dots}>...</span></p>
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
    position: 'relative',
    zIndex: 1,
  },
  spinnerWrap: {
    position: 'relative',
    width: '64px',
    height: '64px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '3px solid #1E2330',
    borderTopColor: '#F2C14E',
    borderRightColor: '#2AB8E6',
    animation: 'spinRing 0.9s linear infinite',
  },
  spinnerDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#0FD584',
    boxShadow: '0 0 12px rgba(15,213,132,0.7)',
  },
  text: {
    color: '#E8E6E0',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.5px',
  },
  dots: { color: '#F2C14E' },
};

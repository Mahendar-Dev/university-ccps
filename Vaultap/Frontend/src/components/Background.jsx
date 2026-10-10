// Vibrant multi-color animated background - gold, cyan, pink, teal orbs
// drifting + rising colorful particles for a lively, eye-catching feel.
export default function Background() {
  const particleColors = ['#F2C14E', '#2AB8E6', '#E14F9C', '#0FD584'];
  const particles = Array.from({ length: 34 }, (_, i) => i);

  return (
    <div style={styles.wrap} aria-hidden="true">
      <div style={{ ...styles.orb, ...styles.orbGold, animation: 'orbFloat1 12s ease-in-out infinite' }} />
      <div style={{ ...styles.orb, ...styles.orbTeal, animation: 'orbFloat2 15s ease-in-out infinite' }} />
      <div style={{ ...styles.orb, ...styles.orbBlue, animation: 'orbFloat3 18s ease-in-out infinite' }} />
      <div style={{ ...styles.orb, ...styles.orbPink, animation: 'orbFloat2 14s ease-in-out infinite reverse' }} />

      <div style={styles.particleLayer}>
        {particles.map((i) => {
          const size = 1.5 + (i % 4) * 0.9;
          const left = (i * 29) % 100;
          const delay = (i % 12) * -2.5;
          const duration = 10 + (i % 8) * 2;
          const color = particleColors[i % particleColors.length];
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                bottom: '-5%',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: color,
                opacity: 0.5,
                boxShadow: `0 0 8px ${color}`,
                animation: `particleRise ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div style={styles.vignette} />
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    inset: 0,
    background: '#07080D',
    overflow: 'hidden',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(65px)',
  },
  orbGold: {
    width: '400px',
    height: '400px',
    top: '4%',
    left: '10%',
    background: 'radial-gradient(circle, rgba(242,193,78,0.4), transparent 70%)',
  },
  orbTeal: {
    width: '440px',
    height: '440px',
    bottom: '2%',
    right: '8%',
    background: 'radial-gradient(circle, rgba(15,213,132,0.32), transparent 70%)',
  },
  orbBlue: {
    width: '360px',
    height: '360px',
    top: '42%',
    left: '52%',
    background: 'radial-gradient(circle, rgba(42,184,230,0.28), transparent 70%)',
  },
  orbPink: {
    width: '320px',
    height: '320px',
    top: '65%',
    left: '18%',
    background: 'radial-gradient(circle, rgba(225,79,156,0.26), transparent 70%)',
  },
  particleLayer: { position: 'absolute', inset: 0 },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 40%, transparent 0%, #07080D 78%)',
  },
};

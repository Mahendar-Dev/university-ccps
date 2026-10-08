import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudRain, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';

function Globe3D() {
  return (
    <Canvas style={{ height: '400px' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Sphere args={[1.5, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#0ea5e9"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.4}
          metalness={0.1}
        />
      </Sphere>
      <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
    </Canvas>
  );
}

export default function Home() {
  const [weather, setWeather] = useState(null);
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    // Fetch Weather (Karachi default for demo)
    axios.get('https://api.open-meteo.com/v1/forecast?latitude=24.8607&longitude=67.0011&current_weather=true')
      .then(res => setWeather(res.data.current_weather))
      .catch(err => console.error("Weather error:", err));

    // Fetch live earthquake data (Significant past 30 days)
    axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson')
      .then(res => {
        if (res.data.features) {
          setDisasters(res.data.features.slice(0, 5));
        }
      })
      .catch(err => console.error("Disasters error:", err));
  }, []);

  return (
    <motion.div 
      className="app-container" style={{ paddingTop: '0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <h1 className="header-title">Global Crisis Grid</h1>
        <p className="header-subtitle">Real-time Environmental Monitoring & Automated Response</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '0' }}>
          <Globe3D />
        </div>
        
        <div>
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
              <CloudRain size={24} /> Live Weather Station
            </h3>
            {weather ? (
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{weather.temperature}°C</div>
                  <div style={{ color: 'var(--text-muted)' }}>Temperature</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{weather.windspeed}</div>
                  <div style={{ color: 'var(--text-muted)' }}><Wind size={16}/> km/h Wind</div>
                </div>
              </div>
            ) : (
              <p>Loading telemetry...</p>
            )}
          </div>

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)' }}>
              <AlertTriangle size={24} /> Global Seismic Activity (USGS)
            </h3>
            {disasters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {disasters.map((d, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--accent-red)' }}>
                    <div style={{ fontWeight: 600 }}>Magnitude {d.properties.mag}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{d.properties.place}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShieldCheck size={48} color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
                <p>No significant threats detected globally.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

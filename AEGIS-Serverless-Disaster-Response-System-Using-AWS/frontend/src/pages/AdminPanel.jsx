import React, { useState } from 'react';
import axios from 'axios';
import { Mail, ShieldCheck, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function AdminPanel({ authKey, role }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (role !== 'Admin') {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <ShieldCheck size={64} color="var(--accent-red)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="header-title" style={{ color: 'var(--accent-red)' }}>Access Denied</h2>
        <p className="header-subtitle">You do not have Administrator clearance to view this sector.</p>
      </div>
    );
  }

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/subscribers`, { email }, {
        headers: { 'X-Auth-Key': authKey }
      });
      setMessage({ type: 'success', text: res.data.message });
      setEmail('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || "Failed to add subscriber." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container" style={{ marginBottom: '2rem' }}>
        <h2 className="header-title" style={{ fontSize: '2.5rem' }}>Administrator Console</h2>
        <p className="header-subtitle">Manage emergency alert distribution lists.</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
          <Mail size={24} /> Add Alert Recipient (SNS)
        </h3>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Enter an email address below to subscribe them to the Critical Incident alert system. They will receive an email from AWS SNS to confirm their subscription.
        </p>

        <form onSubmit={handleAddSubscriber} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Responder Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="responder@agency.gov"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : <><Plus size={20}/> Subscribe Email</>}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderRadius: '8px', 
            background: message.type === 'success' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)',
            border: `1px solid ${message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)'}`
          }}>
            {message.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}

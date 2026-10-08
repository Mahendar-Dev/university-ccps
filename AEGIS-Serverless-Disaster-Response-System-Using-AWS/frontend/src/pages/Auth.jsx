import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Responder');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        onLogin(res.data.token, res.data.role);
        navigate('/threats');
      } else {
        await axios.post(`${API_URL}/signup`, { email, password, role });
        alert('Account created successfully! Please login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <ShieldCheck size={64} color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="header-title" style={{ fontSize: '2rem' }}>
          {isLogin ? 'Security Gateway' : 'Request Clearance'}
        </h2>
        <p className="header-subtitle" style={{ marginBottom: '2rem' }}>
          {isLogin ? 'Enter your credentials to access the grid.' : 'Register a new Responder or Admin account.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="user@aegis.com"
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Requested Role</label>
              <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                <option value="Responder">Field Responder</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Processing...' : (isLogin ? <><LogIn size={20}/> Authenticate</> : <><UserPlus size={20}/> Register Account</>)}
          </button>
        </form>

        <div style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have clearance? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

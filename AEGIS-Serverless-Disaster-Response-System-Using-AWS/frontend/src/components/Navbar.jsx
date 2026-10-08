import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Globe, Map, BarChart2, Settings, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ isAuthenticated, role, onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Globe },
    { path: '/threats', label: 'Threat Map', icon: Map, reqAuth: true },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin', label: 'Admin Panel', icon: Settings, reqRole: 'Admin' },
  ];

  return (
    <nav className="navbar glass-panel" style={{ margin: '0', borderRadius: '0', borderBottom: '1px solid rgba(14, 165, 233, 0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={28} color="#0ea5e9" />
        <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px', color: '#0ea5e9' }}>AEGIS</span>
      </div>
      
      <div className="nav-links">
        {navItems.map(item => {
          if (item.reqAuth && !isAuthenticated) return null;
          if (item.reqRole && role !== item.reqRole) return null;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: 'var(--accent-blue)' }}>{role}</strong>
            </span>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" className="nav-link" style={{ color: 'var(--accent-blue)' }}>
            <LogIn size={18} /> Login / Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}

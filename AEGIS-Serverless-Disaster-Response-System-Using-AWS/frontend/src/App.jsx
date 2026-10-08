import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ThreatMap from './pages/ThreatMap';
import AdminPanel from './pages/AdminPanel';
import Analytics from './Analytics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authKey, setAuthKey] = useState('');
  const [userRole, setUserRole] = useState('');

  const handleLogin = (token, role) => {
    setAuthKey(token);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthKey('');
    setUserRole('');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar isAuthenticated={isAuthenticated} role={userRole} onLogout={handleLogout} />
        
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route 
              path="/auth" 
              element={isAuthenticated ? <Navigate to="/threats" /> : <Auth onLogin={handleLogin} />} 
            />
            
            <Route 
              path="/threats" 
              element={isAuthenticated ? <ThreatMap authKey={authKey} userRole={userRole} /> : <Navigate to="/auth" />} 
            />
            
            <Route 
              path="/analytics" 
              element={<Analytics authKey={authKey} />} 
            />
            
            <Route 
              path="/admin" 
              element={isAuthenticated && userRole === 'Admin' ? <AdminPanel authKey={authKey} role={userRole} /> : <Navigate to="/auth" />} 
            />
          </Routes>
        </div>
        
        <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} AEGIS Global Defense Network. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;

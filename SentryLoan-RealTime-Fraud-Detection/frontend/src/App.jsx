import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AgentDashboard from './components/AgentDashboard';
import LoanApplicationForm from './components/LoanApplicationForm';
import OfficerReview from './components/OfficerReview';
import AccountTracking from './components/AccountTracking';
import './index.css';

function Shell() {
  const { user, logout, ready } = useAuth();
  const [page, setPage] = useState('agent_dashboard');

  if (!ready) return null;

  if (!user) {
    return <Login setPage={setPage} />;
  }

  const isStaff = ['officer', 'admin'].includes(user.role);
  const portalName = isStaff ? 'Bank Loan Officer Portal' : user.role === 'agent' ? 'Bank Agent Portal' : 'My Loan Account Portal';

  return (
    <div>
      <div className="navbar">
        <h1>{portalName}</h1>
        <div>
          <span style={{ marginRight: '15px' }}>{user.name} ({user.role})</span>
          {!isStaff && user.role === 'agent' && (
            <>
              <button onClick={() => setPage('agent_dashboard')}>Dashboard</button>
              <button onClick={() => setPage('loan_application')}>New Application</button>
            </>
          )}
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {isStaff && <OfficerReview />}
      {!isStaff && user.role === 'agent' && page === 'loan_application' && <LoanApplicationForm setPage={setPage} />}
      {!isStaff && user.role === 'agent' && page !== 'loan_application' && <AgentDashboard setPage={setPage} />}
      {!isStaff && user.role === 'applicant' && <AccountTracking />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

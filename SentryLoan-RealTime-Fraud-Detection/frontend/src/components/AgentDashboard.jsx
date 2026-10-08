import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { getSocket } from '../socket';

export default function AgentDashboard({ setPage }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myApplications().then(setApplications).catch((err) => setError(err.message)).finally(() => setLoading(false));

    const socket = getSocket();
    if (!socket) return;
    const handleNew = (application) => setApplications((prev) => [application, ...prev]);
    const handleUpdate = (updated) => setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    socket.on('application:new', handleNew);
    socket.on('application:update', handleUpdate);
    return () => {
      socket.off('application:new', handleNew);
      socket.off('application:update', handleUpdate);
    };
  }, []);

  const getStatusColor = (status) => {
    if (status === 'approved') return '#28a745';
    if (status === 'rejected') return '#dc3545';
    return '#ff9800';
  };

  return (
    <div className="container">
      <h2>Recent Applications</h2>
      <p>Here are the loan applications you've submitted - this list updates live as officers review them.</p>

      {error && <p style={{ color: '#dc3545' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Account ID</th>
            <th>Purpose</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {!loading && applications.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No applications submitted yet.</td></tr>
          ) : (
            applications.map((a) => (
              <tr key={a.id}>
                <td>{a.applicationId}</td>
                <td>{a.accountIdText}</td>
                <td>{a.purpose}</td>
                <td>${Number(a.loanAmount).toLocaleString()}</td>
                <td style={{ color: getStatusColor(a.status), fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {a.status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <br />
      <button className="btn" onClick={() => setPage('loan_application')}>Submit a New Application</button>
    </div>
  );
}

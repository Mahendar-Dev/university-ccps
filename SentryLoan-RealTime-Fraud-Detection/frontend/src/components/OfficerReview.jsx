import { Fragment, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { getSocket } from '../socket';

export default function OfficerReview() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    api.officerApplications().then(setApplications).catch((err) => setError(err.message));

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

  const handleAction = async (id, status) => {
    try {
      await api.decideApplication(id, { status });
    } catch (err) {
      setError(err.message);
    }
  };

  const download = async (application) => {
    try {
      await api.downloadDocument(application.id, application.documentOriginalName);
    } catch (err) {
      setError(err.message);
    }
  };

  const sorted = [...applications].sort((a, b) => b.riskScore - a.riskScore);
  const filtered = filter === 'all' ? sorted : sorted.filter((a) => a.status === filter);

  return (
    <div className="container">
      <h2>Applications Needing Review</h2>
      <p>Review flagged loan applications below - this list updates live as new applications come in.</p>

      {error && <p style={{ color: '#dc3545' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            className="btn"
            style={{ opacity: filter === f ? 1 : 0.6, textTransform: 'capitalize' }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Agent</th>
            <th>Account</th>
            <th>Amount</th>
            <th>Fraud Risk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No applications in this view.</td></tr>
          ) : (
            filtered.map((a) => (
              <Fragment key={a.id}>
                <tr>
                  <td>{a.applicationId}</td>
                  <td>{a.agentName}</td>
                  <td>{a.accountIdText}</td>
                  <td>${Number(a.loanAmount).toLocaleString()}</td>
                  <td>
                    <span className={a.riskLevel === 'High' ? 'badge-high' : 'badge-low'}>
                      {a.riskLevel} ({a.riskScore})
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      {expandedId === a.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expandedId === a.id && (
                  <tr>
                    <td colSpan="6">
                      <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <p><strong>Purpose:</strong> {a.purpose}</p>
                        <p><strong>Status:</strong> {a.status}</p>
                        <p><strong>Triggered Rules:</strong></p>
                        {a.triggeredRules.length === 0 ? (
                          <p>No rules triggered.</p>
                        ) : (
                          <ul>{a.triggeredRules.map((r, i) => <li key={i}>{r}</li>)}</ul>
                        )}
                        {a.documentOriginalName && (
                          <p>
                            <button className="btn" type="button" onClick={() => download(a)}>
                              Download Document ({a.documentOriginalName})
                            </button>
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button className="btn" onClick={() => handleAction(a.id, 'approved')}>Approve</button>
                          <button className="btn btn-reject" onClick={() => handleAction(a.id, 'rejected')}>Reject</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

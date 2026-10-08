import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { getSocket } from '../socket';

export default function AccountTracking() {
  const [account, setAccount] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    api.myAccount().then(setAccount).catch((err) => setError(err.message));
    api.myApplications().then(setApplications).catch((err) => setError(err.message));

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

  const handleSearch = () => {
    setHasSearched(true);
    const found = applications.find((a) => a.applicationId.toUpperCase() === searchQuery.trim().toUpperCase());
    setSearchResult(found || null);
  };

  return (
    <div className="container">
      <h2>Track My Applications</h2>
      {error && <p style={{ color: '#dc3545' }}>{error}</p>}

      {account && (
        <div style={{ marginBottom: '25px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p><strong>Account ID:</strong> {account.accountId}</p>
          <p><strong>Pre-Approved Credit Limit:</strong> ${Number(account.creditLimit).toLocaleString()}</p>
          <p><strong>KYC Expires:</strong> {new Date(account.kycExpiryDate).toLocaleDateString('en-GB')}</p>
          <p><strong>Status:</strong> {account.status}</p>
        </div>
      )}

      <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#004494' }}>Your Application History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Application ID</th>
            <th>Purpose</th>
            <th>Agent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No applications found.</td></tr>
          ) : (
            applications.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.submittedAt).toLocaleDateString('en-GB')}</td>
                <td>{a.applicationId}</td>
                <td>{a.purpose}</td>
                <td>{a.agentName}</td>
                <td style={{ color: getStatusColor(a.status), fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {a.status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <h3>Search Specific Application</h3>
      <div className="form-group" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <input placeholder="Enter Application ID" style={{ flex: 1 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button className="btn" onClick={handleSearch}>Search</button>
      </div>

      {hasSearched && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
          {searchResult ? (
            <div>
              <h3 style={{ color: '#004494', marginBottom: '15px' }}>Search Result</h3>
              <p><strong>Application ID:</strong> {searchResult.applicationId}</p>
              <p><strong>Agent:</strong> {searchResult.agentName}</p>
              <p><strong>Purpose:</strong> {searchResult.purpose}</p>
              <p><strong>Status:</strong> <span style={{ marginLeft: '10px', color: getStatusColor(searchResult.status), fontWeight: 'bold' }}>{searchResult.status}</span></p>
            </div>
          ) : (
            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>No application found with ID "{searchQuery}". Please check and try again.</p>
          )}
        </div>
      )}
    </div>
  );
}

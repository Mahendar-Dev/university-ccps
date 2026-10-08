import { useState } from 'react';
import { api } from '../utils/api';

export default function LoanApplicationForm({ setPage }) {
  const [accountId, setAccountId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);

  const [accountInfo, setAccountInfo] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [checkingAccount, setCheckingAccount] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const checkAccount = async () => {
    if (!accountId.trim()) return;
    setCheckingAccount(true);
    setAccountError('');
    setAccountInfo(null);
    try {
      const account = await api.lookupAccount(accountId.trim());
      setAccountInfo(account);
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setCheckingAccount(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('accountId', accountId.trim());
      formData.append('purpose', purpose);
      formData.append('loanAmount', amount);
      if (file) formData.append('document', file);

      await api.submitLoanApplication(formData);
      setPage('agent_dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong submitting the application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h2>New Loan Application</h2>
      <p>Please fill out the details carefully. Automated validation will check the applicant's credit limit.</p>
      <form onSubmit={submitForm}>
        <div className="form-group">
          <label>Account ID:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              required
              style={{ flex: 1 }}
              placeholder="e.g. ACC-4821"
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setAccountInfo(null); setAccountError(''); }}
            />
            <button type="button" className="btn" onClick={checkAccount} disabled={checkingAccount}>
              {checkingAccount ? 'Checking...' : 'Check Credit Limit'}
            </button>
          </div>
          {accountError && <p style={{ color: '#dc3545', marginTop: '8px' }}>{accountError}</p>}
          {accountInfo && (
            <p style={{ color: accountInfo.status === 'expired' ? '#dc3545' : '#28a745', marginTop: '8px' }}>
              Credit limit: ${Number(accountInfo.creditLimit).toLocaleString()} - Status: {accountInfo.status} -
              KYC expires {new Date(accountInfo.kycExpiryDate).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
        <div className="form-group">
          <label>Purpose of Loan:</label>
          <input required value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Loan Amount ($):</label>
          <input type="number" required min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Supporting Document (PDF):</label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Scoring application...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

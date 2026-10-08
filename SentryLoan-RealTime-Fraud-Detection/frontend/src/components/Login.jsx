import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ setPage }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const routeFor = (role) => {
    if (['officer', 'admin'].includes(role)) return 'officer_review';
    if (role === 'agent') return 'agent_dashboard';
    return 'account_tracking';
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register(form.name, form.email, form.password, form.role);

      setPage(routeFor(loggedInUser.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h2>System Login</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          className="btn"
          style={{ opacity: mode === 'login' ? 1 : 0.6 }}
          onClick={() => { setMode('login'); setError(''); }}
        >
          Log In
        </button>
        <button
          type="button"
          className="btn"
          style={{ opacity: mode === 'register' ? 1 : 0.6 }}
          onClick={() => { setMode('register'); setError(''); }}
        >
          Register
        </button>
      </div>

      <form onSubmit={submitForm}>
        {mode === 'register' && (
          <>
            <div className="form-group">
              <label>Full Name / Agent Name:</label>
              <input required name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>I am a:</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="applicant">Loan Applicant</option>
                <option value="agent">Bank Agent</option>
              </select>
            </div>
          </>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input required type="email" name="email" value={form.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            required
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
          />
        </div>

        {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'login' ? 'Login Securely' : 'Create Account'}
        </button>
      </form>

      <p style={{ color: '#666', marginTop: '20px', fontSize: '13px' }}>
        <strong>Demo staff logins</strong> (pre-seeded, no need to register):<br />
        Officer: <code>officer@bankfraud.test</code> / <code>Officer@12345</code><br />
        Admin: <code>admin@bankfraud.test</code> / <code>Admin@12345</code>
      </p>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Registering above creates a <strong>Bank Agent</strong> or <strong>Loan Applicant</strong> account.
      </p>
    </div>
  );
}

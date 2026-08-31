import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser, getMe } from '../api/authApi';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ fullName: '', email: '', password: '', role: 'LEARNER' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const token = await loginUser(loginData.email, loginData.password);
      
      // Save token temporarily so apiClient includes it
      localStorage.setItem('olms_jwt_token', token);
      
      const userRes = await getMe();
      const userData = userRes.data;
      
      login(token, userData);
      
      setSuccess('Login successful!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err.response?.data || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await registerUser(regData);
      setSuccess(`Account created for ${user.email}! Please sign in.`);
      setTab('login');
      setLoginData({ email: regData.email, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="card-glass auth-card">
        <div className="auth-brand">
          <div className="logo-badge">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>OLMS Portal</h1>
          <p>Online Learning Management System</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Sign In</button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>Register</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="name@example.com" required
                value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" required
                value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="John Doe" required
                value={regData.fullName} onChange={e => setRegData({ ...regData, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="name@example.com" required
                value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Create a strong password" required
                value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={regData.role} onChange={e => setRegData({ ...regData, role: e.target.value })}>
                <option value="LEARNER">Learner</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

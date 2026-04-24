import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, dbUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Navigate after dbUser is set via AuthContext listener
      navigate('/');
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.sub}>Sign in to ShopChat</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p style={styles.footer}>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f23' },
  card: { background: '#1a1a2e', padding: 40, borderRadius: 12, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  title: { color: '#e94560', textAlign: 'center', marginBottom: 4 },
  sub: { color: '#aaa', textAlign: 'center', marginBottom: 24, fontSize: 14 },
  error: { background: '#ff000033', color: '#ff6b6b', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 },
  input: { width: '100%', padding: '10px 14px', marginBottom: 14, background: '#16213e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 14, boxSizing: 'border-box' },
  btn: { width: '100%', padding: 12, background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: 16, color: '#aaa', fontSize: 13 },
};

export default Login;

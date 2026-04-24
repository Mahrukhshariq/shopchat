import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.role, form.displayName);
      navigate(form.role === 'seller' ? '/seller/products' : '/products');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="text" placeholder="Display Name" value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />

          <div style={styles.roleGroup}>
            <label style={styles.roleLabel}>
              <input type="radio" name="role" value="buyer" checked={form.role === 'buyer'}
                onChange={() => setForm({ ...form, role: 'buyer' })} />
              <span>Buyer</span>
            </label>
            <label style={styles.roleLabel}>
              <input type="radio" name="role" value="seller" checked={form.role === 'seller'}
                onChange={() => setForm({ ...form, role: 'seller' })} />
              <span>Seller</span>
            </label>
          </div>

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p style={styles.footer}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f23' },
  card: { background: '#1a1a2e', padding: 40, borderRadius: 12, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  title: { color: '#e94560', textAlign: 'center', marginBottom: 24 },
  error: { background: '#ff000033', color: '#ff6b6b', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 },
  input: { width: '100%', padding: '10px 14px', marginBottom: 14, background: '#16213e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 14, boxSizing: 'border-box' },
  roleGroup: { display: 'flex', gap: 24, marginBottom: 20, color: '#ccc' },
  roleLabel: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 },
  btn: { width: '100%', padding: '12px', background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: 16, color: '#aaa', fontSize: 13 },
};

export default Register;

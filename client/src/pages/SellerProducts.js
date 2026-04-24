import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: '', isAvailable: true };

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products/my');
      setProducts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editId) {
        await api.put(`/api/products/${editId}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, isAvailable: p.isAvailable });
    setEditId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/api/products/${id}`);
    fetchProducts();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>My Products</h2>
        <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>{editId ? 'Edit Product' : 'New Product'}</h3>
          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input style={styles.input} type="number" placeholder="Price (Rs.)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            <input style={styles.input} type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required min="0" />
          </div>
          <textarea style={{ ...styles.input, width: '100%' }} placeholder="Description" rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            <span>Available for sale</span>
          </label>
          <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}</button>
        </form>
      )}

      {loading ? <p style={styles.status}>Loading...</p> : products.length === 0 ? (
        <p style={styles.status}>No products yet. Add your first product!</p>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span>Actions</span>
          </div>
          {products.map((p) => (
            <div key={p._id} style={styles.tableRow}>
              <span style={{ color: '#fff', fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: '#aaa' }}>{p.category}</span>
              <span style={{ color: '#4ade80' }}>Rs. {p.price.toLocaleString()}</span>
              <span style={{ color: p.stock === 0 ? '#ff6b6b' : '#ccc' }}>{p.stock}</span>
              <span style={{ color: p.isAvailable ? '#4ade80' : '#ff6b6b' }}>{p.isAvailable ? 'Active' : 'Hidden'}</span>
              <div style={styles.actions}>
                <button style={styles.editBtn} onClick={() => handleEdit(p)}>Edit</button>
                <button style={styles.delBtn} onClick={() => handleDelete(p._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading: { color: '#e94560', margin: 0 },
  addBtn: { padding: '9px 20px', background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' },
  form: { background: '#1a1a2e', borderRadius: 10, padding: 24, marginBottom: 28 },
  formTitle: { color: '#fff', marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  input: { padding: '10px 14px', background: '#16213e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 14, boxSizing: 'border-box' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontSize: 14, margin: '12px 0' },
  saveBtn: { padding: '10px 28px', background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  status: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  table: { background: '#1a1a2e', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 12, padding: '12px 16px', background: '#16213e', color: '#aaa', fontSize: 13, fontWeight: 600 },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 12, padding: '14px 16px', borderBottom: '1px solid #2a2a4a', alignItems: 'center', fontSize: 14 },
  actions: { display: 'flex', gap: 8 },
  editBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid #e94560', borderRadius: 4, color: '#e94560', cursor: 'pointer', fontSize: 12 },
  delBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid #666', borderRadius: 4, color: '#888', cursor: 'pointer', fontSize: 12 },
};

export default SellerProducts;

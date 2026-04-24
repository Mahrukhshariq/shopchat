import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/api/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      alert('Added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add to cart');
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Browse Products</h2>

      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input style={styles.searchInput} type="text" placeholder="Search products..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <input style={styles.searchInput} type="text" placeholder="Category"
          value={category} onChange={(e) => setCategory(e.target.value)} />
        <button style={styles.searchBtn} type="submit">Search</button>
      </form>

      {loading ? (
        <p style={styles.status}>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={styles.status}>No products found.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((p) => (
            <div key={p._id} style={styles.card}>
              <div style={styles.cardImg}>{p.name[0].toUpperCase()}</div>
              <div style={styles.cardBody}>
                <h3 style={styles.productName}>{p.name}</h3>
                <p style={styles.category}>{p.category}</p>
                <p style={styles.desc}>{p.description?.slice(0, 80)}...</p>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>Rs. {p.price.toLocaleString()}</span>
                  <span style={styles.stock}>Stock: {p.stock}</span>
                </div>
                <p style={styles.seller}>by {p.seller?.displayName || p.seller?.email}</p>
                <div style={styles.cardActions}>
                  <button style={styles.cartBtn} onClick={() => handleAddToCart(p._id)}>Add to Cart</button>
                  <button style={styles.chatBtn} onClick={() => navigate(`/chat/${p.seller?.uid || p.sellerUid}?product=${p._id}`)}>
                    Chat Seller
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
  heading: { color: '#e94560', marginBottom: 20 },
  searchBar: { display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 160, padding: '9px 14px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 14 },
  searchBtn: { padding: '9px 20px', background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600 },
  status: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a4a' },
  cardImg: { height: 100, background: '#16213e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, color: '#e94560', fontWeight: 700 },
  cardBody: { padding: 16 },
  productName: { color: '#fff', margin: '0 0 4px', fontSize: 16 },
  category: { color: '#e94560', fontSize: 12, marginBottom: 6 },
  desc: { color: '#aaa', fontSize: 13, marginBottom: 10, lineHeight: 1.5 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  price: { color: '#4ade80', fontWeight: 700, fontSize: 15 },
  stock: { color: '#aaa', fontSize: 12 },
  seller: { color: '#888', fontSize: 12, marginBottom: 12 },
  cardActions: { display: 'flex', gap: 8 },
  cartBtn: { flex: 1, padding: '8px', background: '#e94560', border: 'none', borderRadius: 5, color: '#fff', cursor: 'pointer', fontSize: 13 },
  chatBtn: { flex: 1, padding: '8px', background: 'transparent', border: '1px solid #e94560', borderRadius: 5, color: '#e94560', cursor: 'pointer', fontSize: 13 },
};

export default ProductList;

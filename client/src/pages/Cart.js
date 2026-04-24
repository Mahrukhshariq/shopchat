import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cart, cartTotal, updateItem, removeItem, fetchCart } = useCart();
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState('');

  const handlePlaceOrder = async () => {
    if (!address.trim()) return alert('Please enter a shipping address');
    setPlacing(true);
    try {
      const res = await api.post('/api/orders', { shippingAddress: address });
      // Notify sellers via socket
      const socket = getSocket();
      res.data.orders.forEach((order) => {
        socket?.emit('order:notify', {
          sellerUid: order.sellerUid,
          orderId: order._id,
          buyerName: dbUser?.displayName || dbUser?.email,
        });
      });
      await fetchCart();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div style={styles.empty}>
        <h2 style={styles.heading}>Your Cart</h2>
        <p style={{ color: '#aaa' }}>Your cart is empty.</p>
        <button style={styles.browseBtn} onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Your Cart</h2>
      <div style={styles.layout}>
        <div style={styles.items}>
          {cart.items.map((item) => (
            <div key={item.product?._id} style={styles.item}>
              <div style={styles.itemAvatar}>{item.product?.name?.[0]}</div>
              <div style={styles.itemInfo}>
                <p style={styles.itemName}>{item.product?.name}</p>
                <p style={styles.itemPrice}>Rs. {item.product?.price?.toLocaleString()}</p>
              </div>
              <div style={styles.qtyControls}>
                <button style={styles.qtyBtn} onClick={() => updateItem(item.product._id, item.quantity - 1)}>-</button>
                <span style={styles.qty}>{item.quantity}</span>
                <button style={styles.qtyBtn} onClick={() => updateItem(item.product._id, item.quantity + 1)}>+</button>
              </div>
              <span style={styles.subtotal}>Rs. {(item.product?.price * item.quantity).toLocaleString()}</span>
              <button style={styles.removeBtn} onClick={() => removeItem(item.product._id)}>✕</button>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>Order Summary</h3>
          <div style={styles.summaryRow}><span>Subtotal</span><span>Rs. {cartTotal.toLocaleString()}</span></div>
          <div style={styles.summaryRow}><span>Shipping</span><span>Free</span></div>
          <div style={{ ...styles.summaryRow, borderTop: '1px solid #333', paddingTop: 12, fontWeight: 700 }}>
            <span>Total</span><span style={{ color: '#4ade80' }}>Rs. {cartTotal.toLocaleString()}</span>
          </div>
          <textarea style={styles.addressInput} placeholder="Shipping address..."
            value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
          <button style={styles.orderBtn} onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  empty: { textAlign: 'center', padding: '60px 16px' },
  heading: { color: '#e94560', marginBottom: 24 },
  layout: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  items: { flex: 2, minWidth: 300 },
  item: { display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a2e', borderRadius: 8, padding: '12px 16px', marginBottom: 12 },
  itemAvatar: { width: 44, height: 44, background: '#16213e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#e94560', fontWeight: 700, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', margin: 0, fontSize: 14, fontWeight: 500 },
  itemPrice: { color: '#aaa', margin: '2px 0 0', fontSize: 13 },
  qtyControls: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, background: '#16213e', border: '1px solid #333', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 15 },
  qty: { color: '#fff', minWidth: 20, textAlign: 'center' },
  subtotal: { color: '#4ade80', fontWeight: 600, fontSize: 14, minWidth: 80, textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 },
  summary: { flex: 1, minWidth: 240, background: '#1a1a2e', borderRadius: 10, padding: 20, height: 'fit-content' },
  summaryTitle: { color: '#fff', marginBottom: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: 14, marginBottom: 10 },
  addressInput: { width: '100%', marginTop: 16, padding: '10px', background: '#16213e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' },
  orderBtn: { width: '100%', marginTop: 14, padding: 12, background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  browseBtn: { marginTop: 16, padding: '10px 24px', background: '#e94560', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' },
};

export default Cart;

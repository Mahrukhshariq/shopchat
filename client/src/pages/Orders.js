import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { pending: '#facc15', confirmed: '#60a5fa', shipped: '#c084fc', delivered: '#4ade80', cancelled: '#f87171' };

const Orders = () => {
  const { dbUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = dbUser?.role === 'seller' ? '/api/orders/seller' : '/api/orders/my';
      const res = await api.get(endpoint);
      setOrders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (dbUser) fetchOrders(); }, [dbUser]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>{dbUser?.role === 'seller' ? 'Received Orders' : 'My Orders'}</h2>

      {loading ? (
        <p style={styles.status}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={styles.status}>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <span style={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</span>
                <span style={{ ...styles.statusBadge, color: STATUS_COLORS[order.status] || '#aaa' }}>
                  ● {order.status.toUpperCase()}
                </span>
              </div>
              <span style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>

            <div style={styles.items}>
              {order.items.map((item, i) => (
                <div key={i} style={styles.item}>
                  <span style={{ color: '#ccc' }}>{item.name}</span>
                  <span style={{ color: '#aaa' }}>x{item.quantity}</span>
                  <span style={{ color: '#4ade80' }}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={styles.cardFooter}>
              <div>
                <p style={styles.footerLine}>
                  {dbUser?.role === 'seller' ? `Buyer: ${order.buyer?.displayName || order.buyer?.email}` : `Seller: ${order.seller?.displayName || order.seller?.email}`}
                </p>
                {order.shippingAddress && <p style={styles.footerLine}>Ship to: {order.shippingAddress}</p>}
              </div>
              <div style={styles.totalBlock}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalAmt}>Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {dbUser?.role === 'seller' && (
              <div style={styles.statusControls}>
                <span style={{ color: '#aaa', fontSize: 13 }}>Update Status:</span>
                {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <button key={s} style={{ ...styles.statusBtn, ...(order.status === s ? styles.statusBtnActive : {}) }}
                    onClick={() => handleStatusChange(order._id, s)} disabled={order.status === s}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  heading: { color: '#e94560', marginBottom: 24 },
  status: { color: '#aaa', textAlign: 'center', marginTop: 40 },
  card: { background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 16, border: '1px solid #2a2a4a' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  orderId: { color: '#fff', fontWeight: 600, marginRight: 12 },
  statusBadge: { fontSize: 12, fontWeight: 600 },
  date: { color: '#666', fontSize: 13 },
  items: { borderTop: '1px solid #2a2a4a', borderBottom: '1px solid #2a2a4a', padding: '12px 0', marginBottom: 12 },
  item: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLine: { color: '#888', fontSize: 13, margin: '2px 0' },
  totalBlock: { textAlign: 'right' },
  totalLabel: { display: 'block', color: '#aaa', fontSize: 12 },
  totalAmt: { color: '#4ade80', fontWeight: 700, fontSize: 18 },
  statusControls: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  statusBtn: { padding: '4px 10px', background: 'transparent', border: '1px solid #444', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' },
  statusBtnActive: { background: '#e94560', borderColor: '#e94560', color: '#fff' },
};

export default Orders;

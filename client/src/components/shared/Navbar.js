import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const { currentUser, dbUser, logout } = useAuth();
  const { cartCount } = useCart();
  const { unreadMessages } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>ShopChat</Link>

      <div style={styles.links}>
        {!currentUser ? (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        ) : (
          <>
            {dbUser?.role === 'buyer' && (
              <>
                <Link to="/products" style={styles.link}>Browse</Link>
                <Link to="/cart" style={styles.link}>
                  Cart {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
                </Link>
                <Link to="/orders" style={styles.link}>My Orders</Link>
              </>
            )}
            {dbUser?.role === 'seller' && (
              <>
                <Link to="/seller/products" style={styles.link}>My Products</Link>
                <Link to="/seller/orders" style={styles.link}>Orders</Link>
              </>
            )}
            <Link to="/chat" style={styles.link}>
              Messages {unreadMessages > 0 && <span style={styles.badge}>{unreadMessages}</span>}
            </Link>
            <span style={styles.userInfo}>{dbUser?.displayName || dbUser?.email}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#1a1a2e', color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  brand: { color: '#e94560', fontWeight: 700, fontSize: 22, textDecoration: 'none', letterSpacing: 1 },
  links: { display: 'flex', alignItems: 'center', gap: 16 },
  link: { color: '#ccc', textDecoration: 'none', fontSize: 14, position: 'relative' },
  badge: { background: '#e94560', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 },
  userInfo: { color: '#aaa', fontSize: 13 },
  logoutBtn: { background: 'transparent', border: '1px solid #e94560', color: '#e94560', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 13 },
};

export default Navbar;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/shared/Navbar';
import PrivateRoute from './components/shared/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import ChatPage from './pages/ChatPage';
import SellerProducts from './pages/SellerProducts';

const HomeRedirect = () => {
  const { dbUser, loading, currentUser } = useAuth();
  
  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (!dbUser) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading profile...</div>;
  
  return <Navigate to={dbUser.role === 'seller' ? '/seller/products' : '/products'} />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <div style={{ minHeight: '100vh', background: '#0f0f23', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
              <Navbar />
              <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Buyer routes */}
                <Route path="/products" element={<PrivateRoute role="buyer"><ProductList /></PrivateRoute>} />
                <Route path="/cart" element={<PrivateRoute role="buyer"><Cart /></PrivateRoute>} />
                <Route path="/orders" element={<PrivateRoute role="buyer"><Orders /></PrivateRoute>} />

                {/* Seller routes */}
                <Route path="/seller/products" element={<PrivateRoute role="seller"><SellerProducts /></PrivateRoute>} />
                <Route path="/seller/orders" element={<PrivateRoute role="seller"><Orders /></PrivateRoute>} />

                {/* Shared */}
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                <Route path="/chat/:otherUid" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

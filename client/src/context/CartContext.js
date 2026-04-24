import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { dbUser } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (dbUser?.role !== 'buyer') return;
    setLoading(true);
    try {
      const res = await api.get('/api/cart');
      setCart(res.data);
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [dbUser]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/api/cart/add', { productId, quantity });
    setCart(res.data);
  };

  const updateItem = async (productId, quantity) => {
    const res = await api.put(`/api/cart/update/${productId}`, { quantity });
    setCart(res.data);
  };

  const removeItem = async (productId) => {
    const res = await api.delete(`/api/cart/remove/${productId}`);
    setCart(res.data);
  };

  const cartCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, cartCount, cartTotal, addToCart, updateItem, removeItem, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

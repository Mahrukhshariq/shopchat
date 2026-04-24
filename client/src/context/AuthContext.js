import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase user
  const [dbUser, setDbUser] = useState(null);           // MongoDB user (role etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    if (user) {
      try {
        const res = await api.get('/api/auth/me');
        setDbUser(res.data);
        await connectSocket(() => user.getIdToken());
      } catch (err) {
        console.error('Profile load error:', err);
        // Still set loading to false even if profile fetch fails
        setDbUser(null);
      }
    } else {
      setDbUser(null);
      disconnectSocket();
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);

  const register = async (email, password, role, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await api.post('/api/auth/register', { role, displayName });
    const res = await api.get('/api/auth/me');
    setDbUser(res.data);
    return cred;
  };

  const login = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try {
    const res = await api.get('/api/auth/me');
    setDbUser(res.data);
    await connectSocket(() => cred.user.getIdToken());
  } catch (e) {
    console.error('Failed to load user profile', e);
  }
  return cred;
};

  const logout = async () => {
    await signOut(auth);
    setDbUser(null);
    disconnectSocket();
  };

  const value = { currentUser, dbUser, loading, register, login, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || 'http://localhost:5000',
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

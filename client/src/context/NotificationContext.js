import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { dbUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!dbUser) return;
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (data) => {
      setUnreadMessages((n) => n + 1);
      addNotification({ type: 'message', ...data });
    };

    const onOrder = (data) => {
      addNotification({ type: 'order', ...data });
    };

    socket.on('notification:message', onMessage);
    socket.on('notification:order', onOrder);

    return () => {
      socket.off('notification:message', onMessage);
      socket.off('notification:order', onOrder);
    };
  }, [dbUser]);

  const addNotification = (notif) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, ...notif, read: false }, ...prev].slice(0, 50));
  };

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => setNotifications([]);
  const clearUnreadMessages = () => setUnreadMessages(0);

  return (
    <NotificationContext.Provider value={{ notifications, unreadMessages, markRead, clearAll, clearUnreadMessages }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

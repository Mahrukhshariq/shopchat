import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const useChat = (otherUid) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  // Load history
  useEffect(() => {
    if (!otherUid) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/chat/history/${otherUid}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load chat history', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [otherUid]);

  // Listen for incoming messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !otherUid) return;

    const onMessage = ({ message }) => {
      const relevant =
        (message.senderUid === otherUid && message.receiverUid === currentUser?.uid) ||
        (message.senderUid === currentUser?.uid && message.receiverUid === otherUid);
      if (relevant) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    const onTyping = ({ senderUid, isTyping: typing }) => {
      if (senderUid === otherUid) setIsTyping(typing);
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [otherUid, currentUser]);

  const sendMessage = useCallback(
    (text, productRefId = null) => {
      const socket = getSocket();
      if (!socket || !text.trim()) return;
      socket.emit('chat:send', { receiverUid: otherUid, text, productRefId });
    },
    [otherUid]
  );

  const sendTyping = useCallback(
    (typing) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('chat:typing', { receiverUid: otherUid, isTyping: typing });

      if (typing) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
          socket.emit('chat:typing', { receiverUid: otherUid, isTyping: false });
        }, 2000);
      }
    },
    [otherUid]
  );

  return { messages, loading, isTyping, sendMessage, sendTyping };
};

export default useChat;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import useChat from '../hooks/useChat';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../utils/api';

const ChatPage = () => {
  const { otherUid } = useParams();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const { currentUser, dbUser } = useAuth();
  const { clearUnreadMessages } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [activeUid, setActiveUid] = useState(otherUid || null);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const { messages, loading, isTyping, sendMessage, sendTyping } = useChat(activeUid);
  const statusMap = useOnlineStatus(activeUid ? [activeUid] : []);

  // Load conversations list
  useEffect(() => {
    api.get('/api/chat/conversations').then((res) => setConversations(res.data)).catch(() => {});
    clearUnreadMessages();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch other user info when activeUid changes
  useEffect(() => {
    if (!activeUid) return;
    api.get(`/api/auth/me`).catch(() => {}); // warm token
    // Find from conversations
    const convo = conversations.find((c) => c.otherUser && c.conversationId.includes(activeUid));
    if (convo?.otherUser) setOtherUser(convo.otherUser);
  }, [activeUid, conversations]);

  const handleSend = () => {
    if (!text.trim() || !activeUid) return;
    sendMessage(text.trim(), productId || null);
    setText('');
    sendTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const isMe = (msg) => msg.senderUid === currentUser?.uid;

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Messages</h3>
        {conversations.length === 0 && (
          <p style={styles.noConvos}>No conversations yet. Start by chatting with a seller!</p>
        )}
        {conversations.map((c) => (
          <div key={c.conversationId} style={{ ...styles.convoItem, ...(activeUid && c.conversationId.includes(activeUid) ? styles.convoActive : {}) }}
            onClick={() => { setActiveUid(c.otherUser?.uid || c.conversationId.replace(currentUser.uid, '').replace('_', '')); setOtherUser(c.otherUser); navigate(`/chat/${c.otherUser?.uid || ''}`); }}>
            <div style={styles.convoAvatar}>{c.otherUser?.displayName?.[0] || '?'}</div>
            <div style={styles.convoInfo}>
              <p style={styles.convoName}>{c.otherUser?.displayName || c.otherUser?.email || 'Unknown'}</p>
              <p style={styles.convoLast}>{c.lastMessage?.text?.slice(0, 36)}...</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div style={styles.chatWindow}>
        {!activeUid ? (
          <div style={styles.placeholder}>
            <p>Select a conversation or browse products to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatAvatar}>{otherUser?.displayName?.[0] || '?'}</div>
              <div>
                <p style={styles.chatName}>{otherUser?.displayName || otherUser?.email || activeUid}</p>
                <p style={styles.chatStatus}>
                  <span style={{ ...styles.dot, background: statusMap[activeUid] ? '#4ade80' : '#666' }} />
                  {statusMap[activeUid] ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              {loading && <p style={styles.loadingMsg}>Loading messages...</p>}
              {messages.map((msg) => (
                <div key={msg._id} style={{ ...styles.msgRow, justifyContent: isMe(msg) ? 'flex-end' : 'flex-start' }}>
                  {msg.productRef && (
                    <div style={styles.productRef}>
                      Re: <strong>{msg.productRef.name}</strong> — Rs. {msg.productRef.price}
                    </div>
                  )}
                  <div style={{ ...styles.bubble, ...(isMe(msg) ? styles.myBubble : styles.theirBubble) }}>
                    <p style={styles.bubbleText}>{msg.text}</p>
                    <span style={styles.bubbleTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                  <div style={{ ...styles.bubble, ...styles.theirBubble }}>
                    <span style={styles.typingDots}>● ● ●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputRow}>
              <textarea style={styles.input} rows={2} placeholder="Type a message... (Enter to send)"
                value={text} onChange={handleInputChange} onKeyDown={handleKeyDown} />
              <button style={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', height: 'calc(100vh - 56px)', background: '#0f0f23' },
  sidebar: { width: 280, background: '#1a1a2e', borderRight: '1px solid #2a2a4a', overflowY: 'auto', padding: '16px 0' },
  sidebarTitle: { color: '#e94560', padding: '0 16px 12px', borderBottom: '1px solid #2a2a4a', margin: 0 },
  noConvos: { color: '#666', fontSize: 13, padding: '16px', lineHeight: 1.6 },
  convoItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1a1a2e' },
  convoActive: { background: '#16213e' },
  convoAvatar: { width: 38, height: 38, borderRadius: '50%', background: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 },
  convoInfo: { flex: 1, overflow: 'hidden' },
  convoName: { color: '#fff', margin: 0, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convoLast: { color: '#666', margin: '2px 0 0', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  chatWindow: { flex: 1, display: 'flex', flexDirection: 'column' },
  placeholder: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#1a1a2e', borderBottom: '1px solid #2a2a4a' },
  chatAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 },
  chatName: { color: '#fff', margin: 0, fontWeight: 600 },
  chatStatus: { color: '#aaa', fontSize: 12, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 },
  loadingMsg: { color: '#555', textAlign: 'center' },
  msgRow: { display: 'flex', flexDirection: 'column' },
  productRef: { fontSize: 11, color: '#888', background: '#1a1a2e', padding: '4px 10px', borderRadius: 4, marginBottom: 4, maxWidth: 300 },
  bubble: { maxWidth: '68%', padding: '10px 14px', borderRadius: 12 },
  myBubble: { background: '#e94560', borderBottomRightRadius: 2, alignSelf: 'flex-end' },
  theirBubble: { background: '#1a1a2e', borderBottomLeftRadius: 2, alignSelf: 'flex-start' },
  bubbleText: { color: '#fff', margin: 0, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', textAlign: 'right', marginTop: 4 },
  typingDots: { color: '#aaa', letterSpacing: 4, fontSize: 10 },
  inputRow: { display: 'flex', gap: 10, padding: '14px 20px', background: '#1a1a2e', borderTop: '1px solid #2a2a4a' },
  input: { flex: 1, padding: '10px 14px', background: '#16213e', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 14, resize: 'none', fontFamily: 'inherit' },
  sendBtn: { padding: '0 24px', background: '#e94560', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
};

export default ChatPage;

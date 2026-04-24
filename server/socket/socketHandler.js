const admin = require('../config/firebase');
const User = require('../models/User');
const Message = require('../models/Message');

// Map: uid -> Set of socketIds (user may have multiple tabs)
const onlineUsers = new Map();

const initSocket = (io) => {
  // Middleware: authenticate socket connection via Firebase token
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required'));

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.uid = decoded.uid;
      socket.email = decoded.email;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = socket.uid;
    console.log(`Socket connected: ${uid} (${socket.id})`);

    // Track online status
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
    onlineUsers.get(uid).add(socket.id);

    // Update DB and broadcast
    await User.findOneAndUpdate({ uid }, { isOnline: true, lastSeen: new Date() });
    io.emit('user:status', { uid, isOnline: true });

    // Join personal room for targeted notifications
    socket.join(`user:${uid}`);

    // ─── Send Message ────────────────────────────────────────────────────────
    socket.on('chat:send', async (data) => {
      const { receiverUid, text, productRefId } = data;
      if (!receiverUid || !text?.trim()) return;

      try {
        const [sender, receiver] = await Promise.all([
          User.findOne({ uid }),
          User.findOne({ uid: receiverUid }),
        ]);
        if (!sender || !receiver) return;

        const conversationId = Message.getConversationId(uid, receiverUid);

        const message = await Message.create({
          conversationId,
          sender: sender._id,
          senderUid: uid,
          receiver: receiver._id,
          receiverUid,
          text: text.trim(),
          productRef: productRefId || null,
        });

        await message.populate('sender', 'displayName email');
        if (productRefId) await message.populate('productRef', 'name price');

        const payload = { message };

        // Emit to sender (all tabs) and receiver
        io.to(`user:${uid}`).emit('chat:message', payload);
        io.to(`user:${receiverUid}`).emit('chat:message', payload);

        // Notification for receiver if they are online but not in this chat
        io.to(`user:${receiverUid}`).emit('notification:message', {
          from: sender.displayName || sender.email,
          fromUid: uid,
          text: text.trim().slice(0, 60),
          conversationId,
        });
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing Indicator ────────────────────────────────────────────────────
    socket.on('chat:typing', ({ receiverUid, isTyping }) => {
      io.to(`user:${receiverUid}`).emit('chat:typing', { senderUid: uid, isTyping });
    });

    // ─── Order Notification (seller) ─────────────────────────────────────────
    socket.on('order:notify', async ({ sellerUid, orderId, buyerName }) => {
      io.to(`user:${sellerUid}`).emit('notification:order', {
        message: `New order from ${buyerName}`,
        orderId,
      });
    });

    // ─── Get Online Status ────────────────────────────────────────────────────
    socket.on('user:getStatus', ({ uids }) => {
      const statuses = uids.map((u) => ({ uid: u, isOnline: onlineUsers.has(u) }));
      socket.emit('user:statusList', statuses);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(uid);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(uid);
          await User.findOneAndUpdate({ uid }, { isOnline: false, lastSeen: new Date() });
          io.emit('user:status', { uid, isOnline: false });
        }
      }
      console.log(`Socket disconnected: ${uid} (${socket.id})`);
    });
  });
};

module.exports = initSocket;

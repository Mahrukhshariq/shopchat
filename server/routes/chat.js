const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// GET /api/chat/conversations — list all conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Get latest message per conversation
    const convos = await Message.aggregate([
      { $match: { $or: [{ senderUid: uid }, { receiverUid: uid }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversationId', lastMessage: { $first: '$$ROOT' } } },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate the other participant's info
    const result = await Promise.all(
      convos.map(async (c) => {
        const otherUid =
          c.lastMessage.senderUid === uid ? c.lastMessage.receiverUid : c.lastMessage.senderUid;
        const otherUser = await User.findOne({ uid: otherUid }).select('displayName email isOnline');
        return { conversationId: c._id, lastMessage: c.lastMessage, otherUser };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chat/history/:otherUid — message history with a specific user
router.get('/history/:otherUid', verifyToken, async (req, res) => {
  try {
    const conversationId = Message.getConversationId(req.user.uid, req.params.otherUid);
    const messages = await Message.find({ conversationId })
      .populate('sender', 'displayName email')
      .populate('productRef', 'name price')
      .sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { conversationId, receiverUid: req.user.uid, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chat/unread — unread message count
router.get('/unread', verifyToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverUid: req.user.uid, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

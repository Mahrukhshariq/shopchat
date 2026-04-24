const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderUid: { type: String, required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverUid: { type: String, required: true },
    text: { type: String, required: true },
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// conversationId = sorted UIDs joined by '_'
messageSchema.statics.getConversationId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);

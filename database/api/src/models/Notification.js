const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel', required: true },
    recipientModel: { type: String, enum: ['User', 'Buyer', 'Seller', 'Admin'], required: true },
    type: { type: String, default: 'info' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderItem: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Denied', 'NeedsAdmin'],
      default: 'Pending',
    },
    decisionReason: { type: String, default: '' },
    decidedAt: { type: Date },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

refundRequestSchema.methods.approve = function () {
  this.status = 'Approved';
  this.decidedAt = new Date();
  return this;
};

refundRequestSchema.methods.deny = function (reason = '') {
  this.status = 'Denied';
  this.decisionReason = reason;
  this.decidedAt = new Date();
  return this;
};

refundRequestSchema.methods.escalate = function (reason = '') {
  this.status = 'NeedsAdmin';
  this.decisionReason = reason;
  this.decidedAt = new Date();
  return this;
};

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    methodType: { type: String, default: 'card' }, // card, wallet, etc.
    token: { type: String, required: true, select: false }, // gateway ref (never exposed)
    isDefault: { type: Boolean, default: false },
    // Reference to owner (one of the account types). Resolved via mixed ref.
    owner: { type: mongoose.Schema.Types.ObjectId, refPath: 'ownerModel', required: true },
    ownerModel: { type: String, enum: ['Buyer', 'Seller'], required: true },
  },
  { timestamps: true }
);

// charge(amount) -> Boolean  (stub; wire a real gateway later)
paymentSchema.methods.charge = async function (amount) {
  if (!amount || amount <= 0) return false;
  // TODO: integrate gateway using this.token
  return true;
};

module.exports = mongoose.model('Payment', paymentSchema);
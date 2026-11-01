const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

cartItemSchema.virtual('lineTotal').get(function () {
  return +(this.quantity * this.unitPrice).toFixed(2);
});

const cartSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    total: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// recalc total: Float
cartSchema.methods.calculateTotal = function () {
  this.total = +this.items
    .reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
    .toFixed(2);
  return this.total;
};

module.exports = mongoose.model('Cart', cartSchema);
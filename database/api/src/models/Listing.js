const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    scale: { type: String, default: '' },
    theme: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Removed'],
      default: 'Pending',
      index: true,
    },
    creationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

listingSchema.index({ name: 'text', description: 'text', theme: 'text' });

// isAvailable() : Boolean
listingSchema.methods.isAvailable = function () {
  return this.status === 'Active' && this.stock > 0;
};

module.exports = mongoose.model('Listing', listingSchema);
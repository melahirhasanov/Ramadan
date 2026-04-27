const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  order_date: { type: Date, required: true },
  total_price: { type: Number, required: true },
  platform: { type: String, enum: ['instagram', 'tanis', 'konullu'], required: true },
  responsible_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  status: {
    type: String,
    enum: ['gozlemede', 'qebul_edilib', 'davam_edir', 'hazirlanir', 'gonderilib', 'catdirilib'],
    default: 'gozlemede'
  },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
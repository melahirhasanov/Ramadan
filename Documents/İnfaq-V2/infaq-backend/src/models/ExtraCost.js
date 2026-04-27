const mongoose = require('mongoose');

const ExtraCostSchema = new mongoose.Schema({
  master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Productss', default: null },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  cost_type: { type: String, enum: ['per_product', 'batch'], required: true },
  batch_quantity: { type: Number, default: 1 },
  quantity_per_unit: { type: Number, default: 1 }, // 🔥 YENİ: 1 vahiddə neçə dənə (məsələn: 1 paket = 100 ədəd)
  cost_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExtraCost', ExtraCostSchema);
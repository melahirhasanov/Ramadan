const mongoose = require('mongoose');

const MaterialPurchaseSchema = new mongoose.Schema({
  master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_cost: { type: Number, required: true },
  product_quantity: { type: Number, default: 1 }, // 🔥 bu material neçə məhsul üçün alınıb
  purchase_date: { type: Date, required: true },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaterialPurchase', MaterialPurchaseSchema);
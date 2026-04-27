const mongoose = require('mongoose');

const ProfitDistributionSchema = new mongoose.Schema({
  order_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Productss', required: true },
  master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  cost_of_goods: { type: Number, required: true },
  net_profit: { type: Number, required: true },
  master_share: { type: Number, required: true }, // 80%
  technical_share: { type: Number, required: true }, // 20%
  calculated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProfitDistribution', ProfitDistributionSchema);
const mongoose = require('mongoose');

const DailyTransportCostSchema = new mongoose.Schema({
  cost_date: { type: Date, required: true, unique: true },
  total_amount: { type: Number, required: true },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyTransportCost', DailyTransportCostSchema);
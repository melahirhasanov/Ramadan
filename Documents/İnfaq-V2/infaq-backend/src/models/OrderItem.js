const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Productss', required: true },
  quantity: { type: Number, required: true },
  unit_selling_price: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);
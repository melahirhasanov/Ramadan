const mongoose = require('mongoose');

const ProductMaterialSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Productss', required: true },
  material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity_per_product: { type: Number, required: true }, // bir məhsul üçün lazım olan miqdar
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductMaterial', ProductMaterialSchema);
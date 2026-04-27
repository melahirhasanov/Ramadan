const mongoose = require('mongoose');

const ProductssSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  master_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  is_approved: { type: Boolean, default: false },
  
  // ✅ Material tələbləri (ID + miqdar)
  material_requirements: [{
    material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true, min: 0.01 }
  }],
  
  // ✅ Əlavə xərclər (ID + miqdar)
  extra_cost_requirements: [{
    extra_cost_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraCost', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Productss', ProductssSchema);
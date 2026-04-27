const mongoose = require('mongoose');

const ProductCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
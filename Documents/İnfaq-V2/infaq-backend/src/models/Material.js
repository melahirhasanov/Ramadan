// models/Material.js
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true }, // iplik, paket, kutu, dənə
  quantity_per_unit: { type: Number, default: 1 }, // 🔥 YENİ: 1 iplikdə neçə dənə var (məsələn: 340)
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', MaterialSchema);
const mongoose = require('mongoose');

const FamilyNeedSchema = new mongoose.Schema(
  {
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    category: { type: String, enum: ['geyim', 'qida', 'derman', 'tehsil'], required: true },
    description: { type: String, required: true },
    medicine_image: { type: String, default: '' },
    is_fulfilled: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FamilyNeed', FamilyNeedSchema);
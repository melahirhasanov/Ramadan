const mongoose = require('mongoose');

const SpiritualSupportSchema = new mongoose.Schema(
  {
    family_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['gozlemede', 'heyata_kechirilib'], default: 'gozlemede' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('SpiritualSupport', SpiritualSupportSchema);
const mongoose = require('mongoose');

const FamilyMemberSchema = new mongoose.Schema(
  {
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['kişi', 'qadın'], required: true },
    age: { type: Number, required: true },
    needs_spiritual_support: { type: Boolean, default: false },
    spiritual_support_reason: { type: String, default: '' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);
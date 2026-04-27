const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact_phone: { type: String, required: true },
    address: { type: String, required: true },
    exact_address: { type: String },
    child_count: { type: Number, default: 0 },
    family_head_status: {
      type: String,
      enum: ['yasayir', 'vefat_edib', 'ayrilib_qeyri_resmi', 'bosaniblar'],
      required: true
    },
    status: {
      type: String,
      enum: ['aktiv', 'qara_siyah', 'muxtelif_sebeb'],
      default: 'aktiv'
    },
    status_reason: { type: String, default: '' },
    health_info: { type: String, default: '' },
    income_source: { type: String, default: '' },
    expenses: { type: String, default: '' },
    short_description: { type: String, default: '' },
    notes: { type: String, default: '' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Family', FamilySchema);
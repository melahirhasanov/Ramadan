const mongoose = require('mongoose');

const FamilyVisitSchema = new mongoose.Schema(
  {
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
    visit_date: { type: Date, required: true },
    visited_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FamilyVisit', FamilyVisitSchema);
const mongoose = require('mongoose');

const AidHistorySchema = new mongoose.Schema(
  {
    family_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', default: null },
    aid_type: { type: String, enum: ['erzaq', 'pul', 'tibbi', 'tehsil'], required: true },
    amount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    aid_date: { type: Date, required: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('AidHistory', AidHistorySchema);
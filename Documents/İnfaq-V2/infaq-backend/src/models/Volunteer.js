const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema(
  {
    person_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true, unique: true },
    free_time: { type: String, default: '' },
    teams: [{ type: String }],
    image: { type: String, default: '' },
    notes: { type: String, default: '' },
    deactivated_until: { type: Date, default: null } // nə vaxta qədər deaktiv olacağı
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Volunteer', VolunteerSchema);
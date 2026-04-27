const mongoose = require('mongoose');

const VolunteerIdeaSchema = new mongoose.Schema(
  {
    volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    links: [{ type: String }],
    is_approved: { type: Boolean, default: false },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    approved_at: { type: Date, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model('VolunteerIdea', VolunteerIdeaSchema);
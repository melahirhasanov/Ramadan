const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PersonSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'backend_responsible', 'volunteer', 'master'],
      default: 'volunteer'
    },
    profile_image: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Şifrəni hash etmə (next parametri OLMADAN)
PersonSchema.pre('save', async function() {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Şifrəni yoxlama
PersonSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('Person', PersonSchema);
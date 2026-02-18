const mongoose = require('mongoose');

const dailyReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  pagesRead: {
    type: Number,
    default: 0,
    min: 0
  },
  goalPages: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'missed', 'partial'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Hər istifadəçi üçün hər gün unikal olsun
dailyReadingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyReading', dailyReadingSchema);
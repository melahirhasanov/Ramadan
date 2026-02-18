const mongoose = require('mongoose');

const readingGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // hər istifadəçinin yalnız bir aktiv hədəfi olsun
  },
  pagesPerDay: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReadingGoal', readingGoalSchema);
const mongoose = require('mongoose');

const ZikrSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: [true, 'Zikr adı tələb olunur'],
    trim: true
  },
  say: {
    type: Number,
    default: 0,
    min: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tip: {
    type: String,
    enum: ['static', 'custom'],
    default: 'custom'
  },
  reng: {
    type: String,
    default: '#4CAF50',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Düzgün hex rəng kodu daxil edin']
  }
}, {
  timestamps: true
});

ZikrSchema.index({ user: 1, ad: 1 }, { unique: true });

module.exports = mongoose.model('Zikr', ZikrSchema);
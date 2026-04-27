const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    report_month: { type: Date, required: true, unique: true }, // ayın ilk günü (YYYY-MM-01)
    actual_income: { type: Number, default: 0 },
    forecast_income: { type: Number, default: 0 },
    actual_expense: { type: Number, default: 0 },
    forecast_expense: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['kassada', 'odenis_olunacaq', 'odenis_olunmayib'],
      default: 'kassada'
    },
    end_of_month_budget: { type: Number, default: 0 },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null },
    approved_at: { type: Date, default: null },
    related_files: [{ type: String }], // Cloudinary URL-ləri
    notes: { type: String, default: '' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Report', ReportSchema);
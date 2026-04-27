const Report = require('../models/Report');
const { getTotalIncomeForMonth, getTotalExpenseForMonth } = require('../utils/costCalculator');

// Yeni hesabat yarat (avtomatik faktiki gəlir və xərci hesablayır)
const createReport = async (req, res) => {
  try {
    const { year, month, forecast_income, forecast_expense, status, notes } = req.body;
    const reportMonth = new Date(year, month - 1, 1);
    
    // Eyni ay üçün hesabat varsa, yenidən yaratma
    const existing = await Report.findOne({ report_month: reportMonth });
    if (existing) {
      return res.status(400).json({ message: 'Report for this month already exists' });
    }
    
    const actual_income = await getTotalIncomeForMonth(year, month);
    const actual_expense = await getTotalExpenseForMonth(year, month);
    const end_of_month_budget = actual_income - actual_expense;
    
    const report = await Report.create({
      report_month: reportMonth,
      actual_income,
      actual_expense,
      forecast_income: forecast_income || 0,
      forecast_expense: forecast_expense || 0,
      status: status || 'kassada',
      end_of_month_budget,
      notes: notes || ''
    });
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hesabatları listələ
const getReports = async (req, res) => {
  try {
    const { year, month } = req.query;
    let filter = {};
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      filter.report_month = { $gte: start, $lte: end };
    }
    const reports = await Report.find(filter).populate('approved_by', 'full_name');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tək hesabat
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('approved_by', 'full_name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hesabatı yenilə (proqnoz, status, qeyd)
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    const { forecast_income, forecast_expense, status, notes, related_files } = req.body;
    if (forecast_income !== undefined) report.forecast_income = forecast_income;
    if (forecast_expense !== undefined) report.forecast_expense = forecast_expense;
    if (status !== undefined) report.status = status;
    if (notes !== undefined) report.notes = notes;
    if (related_files !== undefined) report.related_files = related_files;
    
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hesabatı təsdiqlə (admin)
const approveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.approved_by) {
      return res.status(400).json({ message: 'Report already approved' });
    }
    report.approved_by = req.user._id;
    report.approved_at = new Date();
    await report.save();
    res.json({ message: 'Report approved', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hesabatı sil (admin)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  approveReport,
  deleteReport
};
const express = require('express');
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  approveReport,
  deleteReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // bütün route-lar qorunur

// Admin və backend_responsible hesabat yarada, görə, yeniləyə bilər
router.route('/')
  .get(authorize('admin', 'backend_responsible'), getReports)
  .post(authorize('admin', 'backend_responsible'), createReport);

router.route('/:id')
  .get(authorize('admin', 'backend_responsible'), getReportById)
  .put(authorize('admin', 'backend_responsible'), updateReport)
  .delete(authorize('admin'), deleteReport); // yalnız admin silə bilər

router.put('/:id/approve', authorize('admin'), approveReport); // təsdiq üçün admin

module.exports = router;
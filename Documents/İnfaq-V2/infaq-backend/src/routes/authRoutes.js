const express = require('express');
const {
  login,
  getMe,
  createPerson,
  updatePerson,
  listPersons,
  updateProfile,
  getPersonById,
  deletePerson
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/login', login);

// Private routes
router.get('/me', protect, getMe);

// Admin və backend_responsible üçün icazə
router.post('/persons', protect, authorize('admin', 'backend_responsible'), createPerson);
router.get('/persons', protect, authorize('admin', 'backend_responsible'), listPersons);
router.get('/persons/:id', protect, authorize('admin', 'backend_responsible'), getPersonById);
router.put('/persons/:id', protect, authorize('admin', 'backend_responsible'), updatePerson);
router.delete('/persons/:id', protect, authorize('admin', 'backend_responsible'), deletePerson);

router.put('/profile', protect, updateProfile);

module.exports = router;
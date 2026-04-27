const express = require('express');
const {
  createPerson,
  updatePerson,
  listPersons,
  getPersonById,
  deletePerson
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin və backend_responsible üçün icazə
router.get('/', authorize('admin', 'backend_responsible'), listPersons);
router.get('/:id', authorize('admin', 'backend_responsible'), getPersonById);
router.post('/', authorize('admin', 'backend_responsible'), createPerson);
router.put('/:id', authorize('admin', 'backend_responsible'), updatePerson);
router.delete('/:id', authorize('admin', 'backend_responsible'), deletePerson);

module.exports = router;
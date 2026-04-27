const express = require('express');
const {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addFamilyVisit,
  addFamilyNeed,
  addAidHistory,
  addSpiritualSupport,
  updateSpiritualSupport,
      updateVisit,
  deleteVisit,
  updateNeed,
  deleteNeed,
  updateAid,
  deleteAid
} = require('../controllers/familyController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Bütün ailə əməliyyatları üçün admin və ya backend_responsible tələb olunur
router.use(protect);
router.use(authorize('admin', 'backend_responsible'));

router.route('/')
  .get(getFamilies)
  .post(createFamily);

router.route('/:id')
  .get(getFamilyById)
  .put(updateFamily)
  .delete(deleteFamily);

// Family members
router.post('/:id/members', addFamilyMember);
router.put('/:id/members/:memberId', updateFamilyMember);
router.delete('/:id/members/:memberId', deleteFamilyMember);

// Family visits
router.post('/:id/visits', addFamilyVisit);

// Family needs
router.post('/:id/needs', addFamilyNeed);

// Aid history
router.post('/:id/aids', addAidHistory);

// Spiritual support
router.post('/spiritual-support', addSpiritualSupport);
router.put('/spiritual-support/:supportId', updateSpiritualSupport);
// Ziyarətlər
router.put('/:id/visits/:visitId', authorize('admin', 'backend_responsible'), updateVisit);
router.delete('/:id/visits/:visitId', authorize('admin', 'backend_responsible'), deleteVisit);

// Ehtiyaclar
router.put('/:id/needs/:needId', authorize('admin', 'backend_responsible'), updateNeed);
router.delete('/:id/needs/:needId', authorize('admin', 'backend_responsible'), deleteNeed);

// Yardım tarixçəsi
router.put('/:id/aids/:aidId', authorize('admin', 'backend_responsible'), updateAid);
router.delete('/:id/aids/:aidId', authorize('admin', 'backend_responsible'), deleteAid);
module.exports = router;
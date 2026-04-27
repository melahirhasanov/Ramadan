const express = require('express');
const {
  createVolunteer,
  getVolunteers,
  getVolunteerProfile,
  updateVolunteer,
  deleteVolunteer,
  createIdea,
  getIdeas,
  getIdeaById,        // YENİ
  updateIdea,         // YENİ
  deleteIdea,         // YENİ
  approveIdea,
  likeIdea,
  unlikeIdea,
  deactivateVolunteer,
  activateVolunteer
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// ═══════════════════════════════════════════════════════════
// XÜSUSİ ROUTE-LAR (Ümumi route-lardan ƏVVƏL)
// ═══════════════════════════════════════════════════════════
router.put('/profile/me', updateVolunteer);
router.get('/profile/me', getVolunteerProfile);

// Deaktivasiya/aktivasiya (id ilə)
router.put('/:id/deactivate', authorize('admin', 'backend_responsible'), deactivateVolunteer);
router.put('/:id/activate', authorize('admin', 'backend_responsible'), activateVolunteer);

// ═══════════════════════════════════════════════════════════
// ÜMUMİ ROUTE-LAR (ID ilə işləyən)
// ═══════════════════════════════════════════════════════════
router.get('/profile/:id', authorize('admin', 'backend_responsible'), getVolunteerProfile);
router.put('/profile/:id', authorize('admin', 'backend_responsible'), updateVolunteer);
router.delete('/:id', authorize('admin', 'backend_responsible'), deleteVolunteer);

// ═══════════════════════════════════════════════════════════
// KRUD ƏMƏLİYYATLARI
// ═══════════════════════════════════════════════════════════
router.post('/', authorize('admin', 'backend_responsible'), createVolunteer);
router.get('/', authorize('admin', 'backend_responsible'), getVolunteers);

// ═══════════════════════════════════════════════════════════
// İDEYA ROUTE-LARI
// ═══════════════════════════════════════════════════════════
router.post('/ideas', createIdea);
router.get('/ideas', getIdeas);
router.get('/ideas/:id', getIdeaById);  // YENİ - Tək ideya əldə et
router.put('/ideas/:id', updateIdea);    // YENİ - İdeya yenilə
router.delete('/ideas/:id', deleteIdea); // YENİ - İdeya sil
router.put('/ideas/:id/approve', authorize('admin', 'backend_responsible'), approveIdea);
router.post('/ideas/:id/like', likeIdea);
router.delete('/ideas/:id/like', unlikeIdea);

module.exports = router;
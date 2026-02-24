const express = require('express');
const router = express.Router();
const {
  getZikrler,
  zikrElaveEt,
  zikrArtir,
  zikrAzalt,
  zikrAdDeyis,
  zikrRengDeyis,   // yeni əlavə
  zikrSifirla,
  zikrSil
} = require('../controllers/zikrController');
const auth = require('../middleware/auth');

// Bütün zikr routeları üçün auth tələb olunur
router.use(auth);

router.route('/')
  .get(getZikrler)
  .post(zikrElaveEt);

router.put('/:id/artir', zikrArtir);
router.put('/:id/azalt', zikrAzalt);
router.put('/:id/ad-deyis', zikrAdDeyis);
router.put('/:id/reng-deyis', zikrRengDeyis);  // yeni route
router.put('/:id/sifirla', zikrSifirla);
router.delete('/:id', zikrSil);

module.exports = router;
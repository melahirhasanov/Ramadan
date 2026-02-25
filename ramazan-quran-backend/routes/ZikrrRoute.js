const express = require('express');
const router = express.Router();
const {
  getZikrler,
  zikrElaveEt,
  zikrAdDeyis,
  zikrRengDeyis,
  zikrSil,
  syncZikrler
} = require('../controllers/zikrController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getZikrler)
  .post(zikrElaveEt);

router.put('/sync', syncZikrler); // toplu sinxronizasiya

router.put('/:id/ad-deyis', zikrAdDeyis);
router.put('/:id/reng-deyis', zikrRengDeyis);
router.delete('/:id', zikrSil);

module.exports = router;
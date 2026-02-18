const express = require('express');
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/statsController');
const router = express.Router();

router.use(auth);
router.get('/', getStats);

module.exports = router;
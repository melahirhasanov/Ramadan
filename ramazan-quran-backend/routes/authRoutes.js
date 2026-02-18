const express = require('express');
const { qeydiyyat, giris } = require('../controllers/authController');
const router = express.Router();

router.post('/register', qeydiyyat);
router.post('/login', giris);

module.exports = router;
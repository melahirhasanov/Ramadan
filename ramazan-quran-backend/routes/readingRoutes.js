const express = require('express');
const auth = require('../middleware/auth');
const {
  markToday,
  getToday,
  getCalendar,
  markDate
} = require('../controllers/readingController');
const router = express.Router();

router.use(auth);

router.post('/today', markToday);
router.get('/today', getToday);
router.get('/calendar', getCalendar);
router.post('/:date', markDate); // :date format YYYY-MM-DD

module.exports = router;
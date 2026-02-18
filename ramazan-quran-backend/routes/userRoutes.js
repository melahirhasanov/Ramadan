const express = require('express');
const auth = require('../middleware/auth');
const { getGoal, setGoal } = require('../controllers/userController');
const router = express.Router();

router.use(auth); // bütün user route-ları auth tələb edir

router.get('/goal', getGoal);
router.post('/goal', setGoal);

module.exports = router;
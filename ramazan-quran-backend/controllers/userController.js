const ReadingGoal = require('../models/ReadingGoal');

// @desc    İstifadəçinin hədəfini almaq
// @route   GET /api/user/goal
const getGoal = async (req, res) => {
  try {
    const goal = await ReadingGoal.findOne({ userId: req.user.id });
    res.json({ goal: goal || null });
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Hədəf təyin etmək və ya yeniləmək
// @route   POST /api/user/goal
const setGoal = async (req, res) => {
  try {
    const { pagesPerDay } = req.body;
    if (!pagesPerDay || pagesPerDay < 1) {
      return res.status(400).json({ message: 'pagesPerDay düzgün daxil edilməyib' });
    }

    // `upsert` ilə ya yenilə, ya da yarat
    const goal = await ReadingGoal.findOneAndUpdate(
      { userId: req.user.id },
      { pagesPerDay },
      { new: true, upsert: true }
    );

    res.json({ goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { getGoal, setGoal };
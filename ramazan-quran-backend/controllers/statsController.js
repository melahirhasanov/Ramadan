const DailyReading = require('../models/DailyReading');
const ReadingGoal = require('../models/ReadingGoal');
const { getCurrentRamadanDay, getDaysRemaining, getRamadanDays } = require('../utils/dateHelpers');

// @desc    Statistikanı qaytar
// @route   GET /api/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const goal = await ReadingGoal.findOne({ userId });
    if (!goal) {
      return res.json({
        ramadanDay: getCurrentRamadanDay(),
        daysRemaining: getDaysRemaining(),
        totalPagesRead: 0,
        totalPagesMissed: 0,
        totalDaysRead: 0,
        totalDaysMissed: 0,
        totalDaysPartial: 0
      });
    }

    const readings = await DailyReading.find({ userId });

    const totalPagesRead = readings.reduce((sum, r) => sum + r.pagesRead, 0);
    const totalDaysRead = readings.filter(r => r.status === 'read').length;
    const totalDaysMissed = readings.filter(r => r.status === 'missed').length;
    const totalDaysPartial = readings.filter(r => r.status === 'partial').length;

    // Ramazanın ümumi gün sayı
    const totalDays = getRamadanDays().length;
    const totalPagesGoal = goal.pagesPerDay * totalDays;
    const totalPagesMissed = Math.max(0, totalPagesGoal - totalPagesRead);

    res.json({
      ramadanDay: getCurrentRamadanDay(),
      daysRemaining: getDaysRemaining(),
      totalPagesRead,
      totalPagesMissed,
      totalDaysRead,
      totalDaysMissed,
      totalDaysPartial
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { getStats };
const DailyReading = require('../models/DailyReading');
const ReadingGoal = require('../models/ReadingGoal');
const { getRamadanDays, formatDate } = require('../utils/dateHelpers');

// Köməkçi: status hesabla
const calculateStatus = (pagesRead, goalPages) => {
  if (pagesRead >= goalPages) return 'read';
  if (pagesRead === 0) return 'missed';
  return 'partial';
};

// @desc    Bugünkü oxumanı qeyd et
// @route   POST /api/readings/today
const markToday = async (req, res) => {
  try {
    const { pagesRead } = req.body;
    if (pagesRead === undefined || pagesRead < 0) {
      return res.status(400).json({ message: 'pagesRead düzgün deyil' });
    }

    // İstifadəçinin hədəfini tap
    const goal = await ReadingGoal.findOne({ userId: req.user.id });
    if (!goal) {
      return res.status(400).json({ message: 'Əvvəlcə hədəf təyin edin' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // günün başlanğıcı

    const status = calculateStatus(pagesRead, goal.pagesPerDay);

    const reading = await DailyReading.findOneAndUpdate(
      { userId: req.user.id, date: today },
      { pagesRead, goalPages: goal.pagesPerDay, status },
      { new: true, upsert: true }
    );

    res.json({
      date: formatDate(today),
      pagesRead: reading.pagesRead,
      goalPages: reading.goalPages,
      status: reading.status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Bugünkü oxuma vəziyyətini almaq
// @route   GET /api/readings/today
const getToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reading = await DailyReading.findOne({ userId: req.user.id, date: today });

    // Əgər bu gün üçün qeyd yoxdursa, hədəfə əsasən boş obyekt qaytar
    if (!reading) {
      const goal = await ReadingGoal.findOne({ userId: req.user.id });
      const goalPages = goal ? goal.pagesPerDay : 0;
      reading = { pagesRead: 0, goalPages, status: 'pending' };
    }

    res.json({
      date: formatDate(today),
      pagesRead: reading.pagesRead,
      goalPages: reading.goalPages,
      status: reading.status
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Təqvim üçün bütün Ramazan günlərinin oxuma məlumatı
// @route   GET /api/readings/calendar
const getCalendar = async (req, res) => {
  try {
    const goal = await ReadingGoal.findOne({ userId: req.user.id });
    const defaultGoal = goal ? goal.pagesPerDay : 0;

    const ramadanDays = getRamadanDays();
    const readings = await DailyReading.find({ userId: req.user.id });

    // Hər gün üçün oxuma məlumatını hazırla
    const calendar = ramadanDays.map(date => {
      const dateStr = formatDate(date);
      const existing = readings.find(r => formatDate(r.date) === dateStr);
      return {
        date: dateStr,
        pagesRead: existing ? existing.pagesRead : 0,
        goalPages: existing ? existing.goalPages : defaultGoal,
        status: existing ? existing.status : 'pending'
      };
    });

    res.json(calendar);
  } catch (err) {
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Konkret bir tarix üçün oxuma əlavə et (keçmiş günləri oxumaq)
// @route   POST /api/readings/:date
const markDate = async (req, res) => {
  try {
    const { date } = req.params; // format YYYY-MM-DD
    const { pagesRead } = req.body;

    if (!pagesRead || pagesRead < 0) {
      return res.status(400).json({ message: 'pagesRead düzgün deyil' });
    }

    const goal = await ReadingGoal.findOne({ userId: req.user.id });
    if (!goal) {
      return res.status(400).json({ message: 'Hədəf təyin edilməyib' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const status = calculateStatus(pagesRead, goal.pagesPerDay);

    const reading = await DailyReading.findOneAndUpdate(
      { userId: req.user.id, date: targetDate },
      { pagesRead, goalPages: goal.pagesPerDay, status },
      { new: true, upsert: true }
    );

    res.json({
      date: formatDate(targetDate),
      pagesRead: reading.pagesRead,
      goalPages: reading.goalPages,
      status: reading.status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { markToday, getToday, getCalendar, markDate };
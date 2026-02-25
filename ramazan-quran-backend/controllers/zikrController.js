const Zikr = require('../models/Zikr');

// @desc    İstifadəçinin bütün zikrlərini gətir
// @route   GET /api/zikr
const getZikrler = async (req, res) => {
  try {
    const zikrler = await Zikr.find({ user: req.user.id }).sort({ tip: 1, ad: 1 });
    res.json(zikrler);
  } catch (err) {
    console.error('Zikrləri gətirərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Yeni zikr əlavə et (custom)
// @route   POST /api/zikr
const zikrElaveEt = async (req, res) => {
  try {
    const { ad, say = 0, reng } = req.body;

    if (!ad) {
      return res.status(400).json({ message: 'Zikr adı tələb olunur' });
    }

    const movcud = await Zikr.findOne({ user: req.user.id, ad });
    if (movcud) {
      return res.status(400).json({ message: 'Bu zikr artıq mövcuddur' });
    }

    const zikrData = {
      ad,
      say,
      user: req.user.id,
      tip: 'custom'
    };

    if (reng) {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(reng)) {
        return res.status(400).json({ message: 'Düzgün hex rəng kodu daxil edin' });
      }
      zikrData.reng = reng;
    }

    const zikr = await Zikr.create(zikrData);
    res.status(201).json(zikr);
  } catch (err) {
    console.error('Zikr əlavə edərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikrin rəngini dəyiş
// @route   PUT /api/zikr/:id/reng-deyis
const zikrRengDeyis = async (req, res) => {
  try {
    const { id } = req.params;
    const { reng } = req.body;

    if (!reng) {
      return res.status(400).json({ message: 'Rəng kodu tələb olunur' });
    }

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(reng)) {
      return res.status(400).json({ message: 'Düzgün hex rəng kodu daxil edin' });
    }

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    zikr.reng = reng;
    await zikr.save();

    res.json({
      message: 'Rəng uğurla dəyişdirildi',
      zikr
    });
  } catch (err) {
    console.error('Zikr rəngini dəyişərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikrin adını dəyiş
// @route   PUT /api/zikr/:id/ad-deyis
const zikrAdDeyis = async (req, res) => {
  try {
    const { id } = req.params;
    const { yeniAd } = req.body;

    if (!yeniAd) {
      return res.status(400).json({ message: 'Yeni zikr adı tələb olunur' });
    }

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    if (zikr.tip === 'static') {
      return res.status(400).json({ message: 'Statik zikrlərin adı dəyişdirilə bilməz' });
    }

    const movcud = await Zikr.findOne({ 
      user: req.user.id, 
      ad: yeniAd,
      _id: { $ne: id }
    });
    
    if (movcud) {
      return res.status(400).json({ message: 'Bu adda başqa bir zikr artıq mövcuddur' });
    }

    zikr.ad = yeniAd;
    await zikr.save();

    res.json(zikr);
  } catch (err) {
    console.error('Zikr adını dəyişərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikri sil
// @route   DELETE /api/zikr/:id
const zikrSil = async (req, res) => {
  try {
    const { id } = req.params;

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    if (zikr.tip === 'static') {
      return res.status(400).json({ message: 'Statik zikrlər silinə bilməz' });
    }

    await zikr.deleteOne();
    res.json({ message: 'Zikr silindi' });
  } catch (err) {
    console.error('Zikr silərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Bütün zikrləri sinxronizasiya et (toplu yeniləmə)
// @route   PUT /api/zikr/sync
const syncZikrler = async (req, res) => {
  try {
    const { zikrler } = req.body; // [{ _id, say, ad?, reng? }] - ad və reng dəyişə bilər, ancaq say mütləq

    if (!Array.isArray(zikrler)) {
      return res.status(400).json({ message: 'Zikrler massivi göndərilməlidir' });
    }

    const userId = req.user.id;
    const operationResults = [];

    for (const item of zikrler) {
      if (!item._id) continue; // id olmayan keç

      // Mövcud zikri tap
      const zikr = await Zikr.findOne({ _id: item._id, user: userId });
      if (!zikr) {
        operationResults.push({ _id: item._id, success: false, message: 'Tapılmadı' });
        continue;
      }

      // Say yenilə
      if (item.say !== undefined && typeof item.say === 'number' && item.say >= 0) {
        zikr.say = item.say;
      }

      // Ad yenilə (yalnız custom)
      if (item.ad && zikr.tip === 'custom' && item.ad !== zikr.ad) {
        const movcud = await Zikr.findOne({ user: userId, ad: item.ad, _id: { $ne: item._id } });
        if (!movcud) {
          zikr.ad = item.ad;
        }
      }

      // Rəng yenilə
      if (item.reng && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(item.reng)) {
        zikr.reng = item.reng;
      }

      await zikr.save();
      operationResults.push({ _id: zikr._id, success: true, zikr });
    }

    res.json({
      message: 'Sinxronizasiya tamamlandı',
      results: operationResults
    });
  } catch (err) {
    console.error('Sync xətası:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = {
  getZikrler,
  zikrElaveEt,
  zikrAdDeyis,
  zikrRengDeyis,
  zikrSil,
  syncZikrler
};
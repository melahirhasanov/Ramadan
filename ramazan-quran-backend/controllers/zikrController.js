const Zikr = require('../models/Zikr');

// @desc    İstifadəçinin bütün zikrlərini gətir (statik + custom)
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
    const { ad, say = 0, reng } = req.body; // reng əlavə etdik

    if (!ad) {
      return res.status(400).json({ message: 'Zikr adı tələb olunur' });
    }

    // Eyni adda zikr var yoxla
    const movcud = await Zikr.findOne({ user: req.user.id, ad });
    if (movcud) {
      return res.status(400).json({ message: 'Bu zikr artıq mövcuddur' });
    }

    // Zikr məlumatlarını hazırla
    const zikrData = {
      ad,
      say,
      user: req.user.id,
      tip: 'custom'
    };

    // Əgər rəng göndərilibsə əlavə et
    if (reng) {
      // Hex rəng formatını yoxla (opsional)
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(reng)) {
        return res.status(400).json({ message: 'Düzgün hex rəng kodu daxil edin (məsələn: #FF5733)' });
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

    // Hex rəng formatını yoxla
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(reng)) {
      return res.status(400).json({ message: 'Düzgün hex rəng kodu daxil edin (məsələn: #FF5733)' });
    }

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    // Statik zikrlərin rəngini dəyişməyə icazə verək (istəsəniz məhdudlaşdıra bilərsiniz)
    // if (zikr.tip === 'static') {
    //   return res.status(400).json({ message: 'Statik zikrlərin rəngi dəyişdirilə bilməz' });
    // }

    zikr.reng = reng;
    await zikr.save();

    res.json({
      message: 'Rəng uğurla dəyişdirildi',
      zikr: {
        id: zikr._id,
        ad: zikr.ad,
        say: zikr.say,
        reng: zikr.reng,
        tip: zikr.tip
      }
    });
  } catch (err) {
    console.error('Zikr rəngini dəyişərkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikrin sayını artır (1 və ya göndərilən qədər)
// @route   PUT /api/zikr/:id/artir
const zikrArtir = async (req, res) => {
  try {
    const { id } = req.params;
    const { artim = 1 } = req.body; // neçə dəfə artırılsın

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    zikr.say += artim;
    await zikr.save();

    res.json(zikr);
  } catch (err) {
    console.error('Zikr artırarkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikrin sayını azalt (1 və ya göndərilən qədər)
// @route   PUT /api/zikr/:id/azalt
const zikrAzalt = async (req, res) => {
  try {
    const { id } = req.params;
    const { azaltma = 1 } = req.body; // neçə dəfə azaldılsın

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    // Sayı 0-dan aşağı salma
    zikr.say = Math.max(0, zikr.say - azaltma);
    await zikr.save();

    res.json(zikr);
  } catch (err) {
    console.error('Zikr azaltarkən xəta:', err);
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

    // Statik zikrlərin adını dəyişməyə icazə vermə
    if (zikr.tip === 'static') {
      return res.status(400).json({ message: 'Statik zikrlərin adı dəyişdirilə bilməz' });
    }

    // Yeni adın unikal olub-olmadığını yoxla (özü istisna olmaqla)
    const movcud = await Zikr.findOne({ 
      user: req.user.id, 
      ad: yeniAd,
      _id: { $ne: id } // eyni id olanı nəzərə alma
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

// @desc    Zikrin sayını sıfırla
// @route   PUT /api/zikr/:id/sifirla
const zikrSifirla = async (req, res) => {
  try {
    const { id } = req.params;

    const zikr = await Zikr.findOne({ _id: id, user: req.user.id });
    if (!zikr) {
      return res.status(404).json({ message: 'Zikr tapılmadı' });
    }

    zikr.say = 0;
    await zikr.save();

    res.json(zikr);
  } catch (err) {
    console.error('Zikr sıfırlayarkən xəta:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    Zikri sil
// @route   DELETE /api/zikr/:id
const zikrSil = async (req, res) => {
  try {
    const { id } = req.params;

    // Statik zikrlərin silinməsinin qarşısını almaq istəyiriksə:
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

module.exports = {
  getZikrler,
  zikrElaveEt,
  zikrArtir,
  zikrAzalt,
  zikrAdDeyis,
  zikrRengDeyis,   // yeni əlavə
  zikrSifirla,
  zikrSil
};
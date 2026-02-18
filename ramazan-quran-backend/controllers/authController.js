const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token yaratmaq üçün köməkçi funksiya
const tokenYarat = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    İstifadəçi qeydiyyatı
// @route   POST /api/auth/register
const qeydiyyat = async (req, res) => {
  try {
    const { ad, eposta, sifre } = req.body;

    // Yoxlama
    if (!ad || !eposta || !sifre) {
      return res.status(400).json({ message: 'Bütün sahələr tələb olunur' });
    }

    // E-poçtun unikallığını yoxla
    const movcudIstifadeci = await User.findOne({ eposta });
    if (movcudIstifadeci) {
      return res.status(400).json({ message: 'Bu e-poçt artıq qeydiyyatdan keçib' });
    }

    const istifadeci = await User.create({ 
      ad, 
      eposta, 
      sifre
    });

    res.status(201).json({
      token: tokenYarat(istifadeci._id),
      istifadeci: {
        id: istifadeci._id,
        ad: istifadeci.ad,
        eposta: istifadeci.eposta
      }
    });
  } catch (err) {
    console.error('Qeydiyyat xətası:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

// @desc    İstifadəçi girişi
// @route   POST /api/auth/login
const giris = async (req, res) => {
  try {
    const { eposta, sifre } = req.body;

    // İstifadəçini tap
    const istifadeci = await User.findOne({ eposta });
    
    if (!istifadeci) {
      return res.status(401).json({ message: 'E-poçt və ya şifrə yanlışdır' });
    }

    // Şifrəni yoxla
    const duzgunSifre = await istifadeci.sifreYoxla(sifre);
    if (!duzgunSifre) {
      return res.status(401).json({ message: 'E-poçt və ya şifrə yanlışdır' });
    }

    res.json({
      token: tokenYarat(istifadeci._id),
      istifadeci: {
        id: istifadeci._id,
        ad: istifadeci.ad,
        eposta: istifadeci.eposta
      }
    });
  } catch (err) {
    console.error('Giriş xətası:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { qeydiyyat, giris };
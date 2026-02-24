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
    const { ad, sifre } = req.body;

    // Yoxlama
    if (!ad || !sifre) {
      return res.status(400).json({ message: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // İstifadəçi adının unikallığını yoxla
    const movcudIstifadeci = await User.findOne({ ad });
    if (movcudIstifadeci) {
      return res.status(400).json({ message: 'Bu istifadəçi adı artıq qeydiyyatdan keçib' });
    }

    const istifadeci = await User.create({ 
      ad, 
      sifre
    });

    res.status(201).json({
      token: tokenYarat(istifadeci._id),
      istifadeci: {
        id: istifadeci._id,
        ad: istifadeci.ad
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
    const { ad, sifre } = req.body;

    // İstifadəçini tap (ad ilə)
    const istifadeci = await User.findOne({ ad });
    
    if (!istifadeci) {
      return res.status(401).json({ message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    // Şifrəni yoxla
    const duzgunSifre = await istifadeci.sifreYoxla(sifre);
    if (!duzgunSifre) {
      return res.status(401).json({ message: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    res.json({
      token: tokenYarat(istifadeci._id),
      istifadeci: {
        id: istifadeci._id,
        ad: istifadeci.ad
      }
    });
  } catch (err) {
    console.error('Giriş xətası:', err);
    res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { qeydiyyat, giris };
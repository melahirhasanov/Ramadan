const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  ad: {
    type: String,
    required: [true, 'Ad tələb olunur'],
    trim: true
  },

  sifre: {  // parol əvəzinə sifre
    type: String,
    required: [true, 'Şifrə tələb olunur'],
    minlength: 6
    // select: false-i çıxardım - sadə olsun
  }
}, {
  timestamps: true,  // createdAt və updatedAt avtomatik əlavə edir
  collection: 'istifadeciler'  // collection adı dəyişdirildi
});

// Şifrəni yaddaşa yazmadan əvvəl hash-lə
userSchema.pre('save', async function() {
  // Əgər şifrə dəyişdirilməyibsə, hash-ləmə
  if (!this.isModified('sifre')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.sifre = await bcrypt.hash(this.sifre, salt);
});

// Daxil olarkən şifrəni yoxlamaq üçün metod
userSchema.methods.sifreYoxla = async function(girilenSifre) {
  return await bcrypt.compare(girilenSifre, this.sifre);
};

module.exports = mongoose.model('User', userSchema);
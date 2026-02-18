const RAMADAN_START = new Date(process.env.RAMADAN_START);
const RAMADAN_END = new Date(process.env.RAMADAN_END);

// Ramazan günlərini array şəklində qaytarır
function getRamadanDays() {
  const days = [];
  const currentDate = new Date(RAMADAN_START);
  while (currentDate <= RAMADAN_END) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

// Bugünün Ramazanın neçənci günü olduğunu qaytarır (1-indeksli)
function getCurrentRamadanDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(RAMADAN_START);
  start.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 çünki ilk gün 1-ci gündür
}

// Ramazanın bitməsinə neçə gün qaldığını qaytarır
function getDaysRemaining() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(RAMADAN_END);
  end.setHours(0, 0, 0, 0);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Tarixi YYYY-MM-DD formatında string-ə çevirir
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

module.exports = {
  getRamadanDays,
  getCurrentRamadanDay,
  getDaysRemaining,
  formatDate
};
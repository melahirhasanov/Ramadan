const Family = require('../models/Family');
const AidHistory = require('../models/AidHistory');
const Product = require('../models/Product');
const Order = require('../models/Order');
const VolunteerIdea = require('../models/VolunteerIdea'); // dəyişdirildi

const getDashboardStats = async (req, res) => {
  try {
    // Aktiv ailələrin sayı
    const activeFamilies = await Family.countDocuments({ status: 'aktiv', deleted_at: null });
    
    // Könüllülərin sayı (Person modelində role volunteer olanlar)
    const Person = require('../models/Person');
    const volunteers = await Person.countDocuments({ role: 'volunteer', is_active: true });
    
    // Bugünkü yardımların sayı
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayAids = await AidHistory.countDocuments({
      aid_date: { $gte: today, $lt: tomorrow }
    });
    
    // Təsdiqlənmiş məhsulların sayı
    const totalProducts = await Product.countDocuments({ is_approved: true });
    
    // Ümumi sifarişlərin sayı
    const totalOrders = await Order.countDocuments();
    
    // Təsdiq gözləyən ideyaların sayı
    const pendingIdeas = await VolunteerIdea.countDocuments({ is_approved: false });
    
    res.json({
      activeFamilies,
      volunteers,
      todayAids,
      totalProducts,
      totalOrders,
      pendingIdeas
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
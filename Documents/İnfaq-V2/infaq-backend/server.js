require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const cloudinaryConfig = require('./src/config/cloudinary');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const familyRoutes = require('./src/routes/familyRoutes');
const volunteerRoutes = require('./src/routes/volunteerRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const statsRoutes = require('./src/routes/statsRoute');
const personRoutes = require('./src/routes/personRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
connectDB();

// Cloudinary config
cloudinaryConfig();

// Default admin yarat
const createDefaultAdmin = async () => {
  const Person = require('./src/models/Person');
  
  const adminExists = await Person.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL });
  if (!adminExists) {
    await Person.create({
      full_name: 'Admin',
      email: process.env.DEFAULT_ADMIN_EMAIL,
      phone: '0000000000',
      password_hash: process.env.DEFAULT_ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log('Default admin created');
  }
};
createDefaultAdmin();

// ═══════════════════════════════════════════════════════════
// CRON JOB – Müddəti bitmiş deaktiv könüllüləri aktivləşdir
// ═══════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'test') {
  try {
    require('./src/jobs/checkDeactivatedVolunteers');
    console.log('✅ Cron job scheduled for deactivated volunteers');
  } catch (err) {
    console.error('⚠️ Cron job could not be loaded:', err.message);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', tradeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/persons', personRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Infaq Backend is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
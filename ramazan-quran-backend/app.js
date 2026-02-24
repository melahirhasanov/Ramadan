const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const readingRoutes = require('./routes/readingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const zikrRoutes = require('./routes/ZikrrRoute');

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // JSON veriləri oxumaq üçün

// Route-lar
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/zikr', zikrRoutes);

// Ana səhifə (test üçün)
app.get('/', (req, res) => {
  res.send('Ramazan Quran API işləyir');
});

module.exports = app;
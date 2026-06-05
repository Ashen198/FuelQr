const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Quota = require('./models/Quota');

const app = express();

// Middleware to parse JSON payloads and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (Update connection string if using Atlas)
mongoose.connect('mongodb://localhost:27017/fuelQrDB')
  .then(() => console.log('Connected securely to MongoDB.'))
  .catch(err => console.error('Database connection error:', err));

// --- REST API ENDPOINTS ---

// GET: Retrieve all quotas sorted by newest first
app.get('/api/quotas', async (req, res) => {
  try {
    const quotas = await Quota.find().sort({ createdAt: -1 });
    res.status(200).json(quotas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotas.' });
  }
});

// POST: Add a new quota
app.post('/api/quotas', async (req, res) => {
  try {
    const { vehicleType, allowedLiters } = req.body;
    if (!vehicleType || !allowedLiters) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const newQuota = new Quota({ vehicleType, allowedLiters });
    await newQuota.save();
    res.status(201).json(newQuota);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quota.' });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
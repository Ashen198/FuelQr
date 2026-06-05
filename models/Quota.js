const mongoose = require('mongoose');

const QuotaSchema = new mongoose.Schema({
  vehicleType: { type: String, required: true },
  allowedLiters: { type: Number, required: true },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quota', QuotaSchema);
const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicleNo: { type: String, required: true, unique: true },
  vehicleModel: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  nic: { type: String, required: true },
  fuelType: { type: String, required: true },
  station: { type: String, required: true },
  quota: { type: Number, required: true },
  qrString: { type: String, default: 'Not Available' },
  status: { type: String, default: 'Active' },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);

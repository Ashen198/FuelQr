const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    operatingHours: { type: String, required: true },
    contact: { type: String, required: true },
    facilities: { type: [String], required: true }
});

module.exports = mongoose.model('Station', stationSchema);

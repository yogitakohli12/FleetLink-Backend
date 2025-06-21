const express = require('express');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const router = express.Router();

// Helper for ride duration
const getRideDuration = (from, to) => Math.abs(parseInt(to) - parseInt(from)) % 24;

// POST /api/vehicles
router.post('/', async (req, res) => {
  try {
    const { name, capacityKg, tyres } = req.body;
    if (!name || !capacityKg || !tyres) return res.status(400).json({ error: 'All fields required' });
    const vehicle = await Vehicle.create({ name, capacityKg, tyres });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/available
router.get('/available', async (req, res) => {
  try {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;
    const rideHours = getRideDuration(fromPincode, toPincode);
    const start = new Date(startTime);
    const end = new Date(start.getTime() + rideHours * 3600 * 1000);

    const vehicles = await Vehicle.find({ capacityKg: { $gte: capacityRequired } });
    const bookings = await Booking.find({
      startTime: { $lt: end },
      endTime: { $gt: start }
    });
    const bookedIds = bookings.map(b => b.vehicleId.toString());
    const available = vehicles.filter(v => !bookedIds.includes(v._id.toString()));

    res.status(200).json({ availableVehicles: available, estimatedRideDurationHours: rideHours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
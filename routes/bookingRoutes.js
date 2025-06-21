const express = require('express');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const router = express.Router();
const getRideDuration = (from, to) => Math.abs(parseInt(to) - parseInt(from)) % 24;

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { vehicleId, vehiclename, fromPincode, toPincode, startTime, customerId } = req.body;
    const rideHours = getRideDuration(fromPincode, toPincode);
    const start = new Date(startTime);
    const end = new Date(start.getTime() + rideHours * 3600 * 1000);

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle ID doesnot exist' });

    const overlapping = await Booking.findOne({
      vehicleId,
      vehiclename,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlapping) return res.status(409).json({ error: 'Vehicle already booked for an overlapping time slot' });

    const booking = await Booking.create({
      vehicleId,
      vehiclename,
      fromPincode,
      toPincode,
      startTime: start,
      endTime: end,
      customerId
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/',async(req,res)=>{
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }})

// DELETE /api/bookings/:id route
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });
    res.status(200).json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});


module.exports = router;
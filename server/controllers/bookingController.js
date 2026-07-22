const db = require('../services/db');
const { notifyBooking } = require('../services/email');

const TIME_SLOTS = [
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM'
];

exports.getSlots = (req, res) => {
  res.json({ success: true, data: TIME_SLOTS });
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, email, courseId, courseName, branchId, branchName, date, timeSlot, message } = req.body;

    if (!name || !phone || !courseName || !branchName || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all booking steps: course, branch, date, time, and your contact details.'
      });
    }

    if (!/^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, '').slice(-10))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const booking = await db.create('bookings', {
      name: name.trim(),
      phone: String(phone).replace(/\D/g, '').slice(-10),
      email: email || '',
      courseId: courseId || '',
      courseName,
      branchId: branchId || '',
      branchName,
      date,
      timeSlot,
      message: message || '',
      status: 'pending'
    });

    await db.create('notifications', {
      type: 'booking',
      title: 'New Booking',
      message: `${booking.name} booked ${booking.courseName} at ${booking.branchName}`,
      refId: booking.id,
      read: false
    });

    notifyBooking(booking).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully! We will contact you shortly.',
      data: { id: booking.id }
    });
  } catch (err) {
    next(err);
  }
};

exports.listAdmin = async (req, res, next) => {
  try {
    let bookings = await db.getAll('bookings');
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (req.query.status) bookings = bookings.filter((b) => b.status === req.query.status);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const booking = await db.update('bookings', req.params.id, { status });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking status updated', data: booking });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await db.remove('bookings', req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};

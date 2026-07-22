const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user) return null;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
  return transporter;
}

async function sendNotification(subject, html) {
  const tx = getTransporter();
  if (!tx || !config.smtp.notifyEmail) {
    console.log(`[email skipped] ${subject}`);
    return { sent: false };
  }
  try {
    await tx.sendMail({
      from: `"Seekho Academy" <${config.smtp.user}>`,
      to: config.smtp.notifyEmail,
      subject,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('[email error]', err.message);
    return { sent: false, error: err.message };
  }
}

async function notifyBooking(booking) {
  return sendNotification(
    `New Booking — ${booking.courseName || booking.course}`,
    `
    <h2>New Training Booking</h2>
    <p><strong>Name:</strong> ${booking.name}</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Email:</strong> ${booking.email || '—'}</p>
    <p><strong>Course:</strong> ${booking.courseName || booking.course}</p>
    <p><strong>Branch:</strong> ${booking.branchName || booking.branch}</p>
    <p><strong>Date:</strong> ${booking.date}</p>
    <p><strong>Time:</strong> ${booking.timeSlot}</p>
    <p><strong>Message:</strong> ${booking.message || '—'}</p>
    `
  );
}

async function notifyEnquiry(enquiry) {
  return sendNotification(
    `New Enquiry — ${enquiry.name}`,
    `
    <h2>New Website Enquiry</h2>
    <p><strong>Name:</strong> ${enquiry.name}</p>
    <p><strong>Phone:</strong> ${enquiry.phone}</p>
    <p><strong>Email:</strong> ${enquiry.email || '—'}</p>
    <p><strong>Message:</strong> ${enquiry.message}</p>
    `
  );
}

module.exports = { sendNotification, notifyBooking, notifyEnquiry };

const db = require('../services/db');

exports.stats = async (req, res, next) => {
  try {
    const [bookings, enquiries, branches, gallery, blogs, reviews, visits, notifications] =
      await Promise.all([
        db.getAll('bookings'),
        db.getAll('enquiries'),
        db.getAll('branches'),
        db.getAll('gallery'),
        db.getAll('blogs'),
        db.getAll('testimonials'),
        db.getAll('visits'),
        db.getAll('notifications')
      ]);

    const today = new Date().toISOString().slice(0, 10);
    const todaysBookings = bookings.filter((b) => (b.createdAt || '').startsWith(today));
    const totalVisits = visits.reduce((sum, v) => sum + Number(v.count || 0), 0);
    const unread = notifications.filter((n) => !n.read);

    res.json({
      success: true,
      data: {
        totalBookings: bookings.length,
        todaysBookings: todaysBookings.length,
        totalEnquiries: enquiries.length,
        totalBranches: branches.length,
        totalGalleryImages: gallery.length,
        totalBlogs: blogs.length,
        totalReviews: reviews.length,
        totalWebsiteVisits: totalVisits,
        unreadNotifications: unread.length,
        recentBookings: bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        recentEnquiries: enquiries
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.notifications = async (req, res, next) => {
  try {
    const items = await db.getAll('notifications');
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: items.slice(0, 50) });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    if (req.params.id === 'all') {
      const items = await db.getAll('notifications');
      await Promise.all(items.map((n) => db.update('notifications', n.id, { read: true })));
      return res.json({ success: true, message: 'All notifications marked as read' });
    }
    const item = await db.update('notifications', req.params.id, { read: true });
    if (!item) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'seekho_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@seekhoacademy.com',
    password: process.env.ADMIN_PASSWORD || 'Seekho@Admin2026'
  },
  sheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED === 'true',
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    notifyEmail: process.env.NOTIFY_EMAIL || ''
  },
  contact: {
    phones: ['9748481630', '7980108587', '7980110273'],
    whatsapp: process.env.WHATSAPP_NUMBER || '9748481630'
  },
  uploads: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  }
};

# Seekho Two Wheeler Academy

Premium scooty & bike training academy website with a full admin panel.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JS, Swiper.js, AOS, Font Awesome
- **Backend:** Node.js + Express
- **Database:** Google Sheets API (optional) with local JSON fallback
- **Auth:** JWT + bcrypt
- **Images:** Multer + Sharp → WebP in `/public/uploads`

## Quick Start

```bash
npm install
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin/login.html

### Default Admin Login

| Field | Value |
|-------|-------|
| Email | `admin@seekhoacademy.com` |
| Password | `Seekho@Admin2026` |

Change these in `.env` before production.

```bash
npm run seed    # re-seed demo content
npm run dev     # start with --watch
```

## Project Structure

```
├── admin/                 # Admin panel (JWT SPA)
├── public/                # Public website
│   ├── css/main.css
│   ├── js/                # app.js, layout.js, home.js, pages/*
│   ├── pages/             # Inner pages
│   └── uploads/           # Optimized WebP uploads
├── server/
│   ├── controllers/       # API controllers
│   ├── routes/api.js
│   ├── services/          # db, auth, upload, email
│   └── data/              # Local JSON store (Sheets fallback)
└── scripts/seed.js
```

## Admin Modules

| Module | Capabilities |
|--------|--------------|
| Dashboard | Bookings, enquiries, visits, notifications |
| Banners | Add / edit / delete / activate / reorder |
| Gallery | Multi-upload, categories, reorder, lightbox-ready |
| Blogs | SEO fields, slug URLs `/blog/:slug`, schedule |
| Branches | Locator fields, maps, courses, trainers |
| Pricing | Live course prices on website |
| Bookings | 5-step flow stored + email notify |
| Enquiries | Contact form → Sheets/JSON + notify |
| FAQs | Full CRUD |
| Testimonials | Photo + video reviews |
| Settings | Social links, phones, ratings, password |

## Google Sheets (Optional)

1. Create a Google Cloud service account and a spreadsheet.
2. Share the sheet with the service account email.
3. Create tabs named: `banners`, `gallery`, `blogs`, `branches`, `pricing`, `bookings`, `enquiries`, `faqs`, `testimonials`, `settings`, `visits`, `admins`, `notifications`.
4. Set in `.env`:

```
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

When Sheets is disabled or unavailable, the app uses `server/data/*.json`.

## Email Notifications

Configure SMTP in `.env` to receive booking/enquiry emails.

## SEO

- Meta / Open Graph / Twitter tags on all pages
- JSON-LD LocalBusiness + FAQ schema
- `/sitemap.xml` and `/robots.txt`

## Vercel Deployment

1. Import repo **https://github.com/r-swetha1473/seekho2wheeler**
2. Set **Root Directory** to repository root (`.`), **not** `public`
3. Framework Preset: Other
4. Environment variables:

```
BASE_URL=https://seekho2wheeler.vercel.app
NODE_ENV=production
JWT_SECRET=<long-random-secret>
ADMIN_EMAIL=admin@seekhoacademy.com
ADMIN_PASSWORD=<secure-password>
```

5. Redeploy after setting env vars.
6. Verify: `https://seekho2wheeler.vercel.app/api/health` returns JSON.

Frontend uses same-origin `/api` via `public/js/config.js` (`API_BASE_URL: ''`).
Seed defaults ship in `server/seed-defaults/` for cold starts.
For durable bookings/enquiries, enable Google Sheets (`GOOGLE_SHEETS_ENABLED=true`).

## Brand

- Primary: `#F5B700`
- Dark: `#222222`
- WhatsApp: `9748481630`
- Phones: `9748481630` · `7980108587` · `7980110273`

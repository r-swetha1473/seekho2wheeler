# Seekho Two Wheeler Academy

Premium scooty & bike training academy website with a full admin panel.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JS, Swiper.js, AOS, Font Awesome
- **Backend:** Node.js + Express
- **Database:** Google Sheets API (optional) with local JSON fallback
- **Auth:** JWT + bcrypt
- **Images:** Cloudinary (primary) — Google Sheets stores HTTPS URLs only

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
│   └── images/            # Static seed/placeholder assets only
│       (admin uploads go to Cloudinary — not stored in git)
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

## Google Sheets (Primary Database)

When `GOOGLE_SHEETS_ENABLED=true` **and** credentials are set, Google Sheets is the **only** database.

| Tab | Purpose |
|-----|---------|
| `bookings` | Training bookings (permanent) |
| `enquiries` | Contact form submissions (permanent) |
| `branches` | Branch locator |
| `pricing` | Course pricing |
| `blogs` | Blog posts |
| `testimonials` | Reviews |
| `banners`, `gallery`, `faqs`, `settings`, … | Site content |

**Local JSON is development-only** (`GOOGLE_SHEETS_ENABLED=false`).  
Production bookings are **never** written to local JSON or `/tmp`.

### Setup

1. Google Cloud → create service account → enable **Google Sheets API** (+ Drive API optional)
2. Create a spreadsheet (or use yours) and **share it with the service account email** (Editor)
3. Auth — pick **one** mode:

**Mode B (recommended on Windows / Node 22):** download the JSON key and save as:

```
credentials/service-account.json
```

**Mode A (env vars):** set email + PEM key (easy to break with escaping on Windows):

```
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_ID=1muxLXxr3iCNtj5-phkJjma1v8ymng7Bw9lHrTlx5kCk
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

If Mode A fails with `error:1E08010C:DECODER routines::unsupported`, use Mode B.

4. Create tabs + headers (and optional content seed):

```bash
npm run init-sheets
npm run init-sheets -- --seed
```

5. On Vercel, set Sheets env vars (JSON mode is most reliable):

```bash
npm run print-vercel-sheets-env
```

Paste the printed `GOOGLE_SERVICE_ACCOUNT_JSON` (plus `GOOGLE_SHEETS_ENABLED` / `GOOGLE_SHEETS_ID`) into Vercel → Environment Variables, then **Redeploy**.  
Verify `/api/health` shows `"storage":"google-sheets (primary)"` and `"sheetsReady":true`.

## Cloudinary (Primary Media Storage)

Admin uploads (banners, gallery, blogs, branches, testimonials) go to **Cloudinary**.  
Google Sheets stores **only the HTTPS URL** — never image binary data.

1. Create a Cloudinary account and copy API credentials
2. Add to `.env` / Vercel:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=seekho
```

3. Admin flow: select image → client preview + 5MB validation + compress → upload with progress → Cloudinary URL saved to Sheets
4. Deleting a record also deletes the Cloudinary asset
5. Public pages use responsive Cloudinary `srcset` (`f_auto,q_auto,w_*`)

`/public/uploads` is gitignored (legacy local-dev fallback only). Do not commit uploaded images.

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
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
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

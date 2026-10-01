# Seekho Two Wheeler Academy — Change Request (26-09-2026)

> **How to use in Cursor:** Put this file in the repo root (e.g. `docs/CHANGES.md`), open Cursor Agent/Composer, and say:
> *"Read docs/CHANGES.md. Implement one task at a time in the order given in section 'Implementation order'. After each task, list the files changed and how to test it. Do not start the next task until I say 'next'."*

## 0. Project context (do not change the stack)

- Frontend: HTML/CSS/Vanilla JS (Swiper, AOS) in `public/`; Admin SPA in `admin/`
- Backend: Node + Express in `server/`, entry for Vercel is `api/index.js`, routes in `server/routes/api.js`
- Database: Google Sheets is the primary store (`GOOGLE_SHEETS_ENABLED=true`); local JSON in `server/data/` is dev fallback only
- Images: Cloudinary; Sheets stores only HTTPS URLs
- Auth: JWT + bcrypt
- Deploy: Vercel (`vercel.json` routes `/api/*`, `/blog/*`, `/sitemap.xml`, `/robots.txt` to `api/index.js`; `/admin/*` and `/*` to static)

## 0.1 Global rules for every task

1. **Every piece of editable content must be stored in Google Sheets** (new tab or new columns) and be editable from the admin panel. No hard-coded text, price, image or session count in public HTML/JS for the sections below.
2. **Sheet changes must be automatic.** Update `scripts/init-sheets` (and the seed) so that `npm run init-sheets` creates any new tab and headers. Also make the DB service self-heal: if a tab or header is missing at runtime, create it instead of throwing.
3. **Every new admin module** = list, add, edit, delete, activate/deactivate, reorder (where relevant), with client-side validation and a success/error toast.
4. **Public site must read content from the API** (`/api/...`), with a sensible fallback to seed defaults in `server/seed-defaults/` if Sheets is empty.
5. **Text formatting:** wherever the admin edits text, use the rich-text editor from Task 2 (bold / normal). Sanitise HTML on the server before saving (allow only `b, strong, i, em, br, p, ul, ol, li, a`).
6. **Do not commit secrets.** Do not touch `credentials/`, `.env`, or print keys in logs.
7. Keep the existing brand (`#F5B700`, `#222222`) and mobile-first layout. Nothing may overflow its container.
8. After each task provide: files changed, new API endpoints, new Sheet tabs/columns, and manual test steps.

---

## Implementation order

1. Task 1 — Fix admin login 500 error
2. Task 2 — Rich text (bold / normal) in admin
3. Task 3 — Editable courses (image, text, price, number of classes) + new course template
4. Task 4 — Doorstep scooty distance-based pricing
5. Task 5 — New "Doorstep Training" section
6. Task 6 — Clickable cards → detail pages (standard feature)
7. Task 7 — Editable "Why Choose Seekho"
8. Task 8 — "Our Mission" details page (new tab)
9. Task 9 — Deterministic chatbot
10. Task 10 — GMB link + latitude/longitude
11. Task 11 — Updates / announcements section
12. Task 12 — Multiple blogs
13. Task 13 — Google SEO / page indexing

---

## Task 1 — Login fails with 500 "resource not found"

**Problem:** Admin login returns HTTP 500 with "resource not found".

**Investigate in this order and fix the root cause:**

1. Check `/api/health` — must return `"storage":"google-sheets (primary)"` and `"sheetsReady":true`. If not, env vars are missing on Vercel.
2. Login controller (`server/controllers/*auth*`) and `server/services/auth`: find where a lookup can throw "not found" (missing `users`/`admin`/`settings` tab in the sheet, wrong tab name, empty header row, or `ADMIN_EMAIL`/`ADMIN_PASSWORD` not set).
3. Confirm the admin login page calls the correct path. Admin is served at `/admin/login.html`; the API call must be same-origin `/api/auth/login` (or whatever `server/routes/api.js` defines) and that route must exist and be mounted.
4. Confirm `vercel.json` routing works for `/admin/login.html` and `/api/*` after deploy.

**Required fix behaviour:**
- If the admin record/tab does not exist, create it from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bcrypt hashed) on first login instead of returning 500.
- Wrong credentials → `401` with a clear message. Missing config → `503` with a clear message. Never a generic 500.
- Log the real error server-side (no secrets), return a safe message to the client.

**Acceptance:** Login works locally and on Vercel with Sheets enabled; wrong password gives 401; deleting the admin tab and retrying still recovers.

---

## Task 2 — Bold / Normal text control in admin

**Requirement:** Admin must be able to change any text between **bold** and normal.

**Implement:**
- A small reusable rich-text component in `admin/` (toolbar: **B**, normal/clear-format, optional line break). Use a lightweight lib (e.g. Quill or Tiptap) or a `contenteditable` with `execCommand` — keep it dependency-light.
- Replace plain `<textarea>`/`<input>` for description-type fields across all admin modules with this component.
- Store as sanitised HTML in Sheets; render on the public site with `innerHTML` only after sanitisation.
- Titles/short labels may use a simple "Bold" toggle stored as a boolean column (`title_bold`).

**Acceptance:** Select text → click B → save → public page shows bold; click normal → shows normal.

---

## Task 3 — Editable course content + New Course template

### 3a. Make course content fully editable
Editable per course from admin: **image** (Cloudinary upload), **title**, **description**, **price (decimal, e.g. 4500.00)**, **number of classes** (e.g. the "15 classes" label), plus optional badge text.

- Sheet tab `pricing` (or `courses`): columns `id, name, slug, description, price, classes, image_url, badge, is_active, sort_order, created_at, updated_at`.
- `price` is a decimal number; validate `>= 0`, 2 decimal places, display with `₹` and Indian number formatting.
- `classes` is an integer `>= 1`; public label auto-renders as `"{classes} classes"`. No hard-coded "15 classes" anywhere.

### 3b. Create new course from admin (template)
- "Add Course" button opens a form with **required fields: Name, Description, Amount, Number of Classes**; optional: image, badge, active toggle.
- On save: generate `slug`, append row to Sheets, and the course must appear automatically on the public courses/pricing section and the booking flow dropdown — **no code change needed for a new course**.
- Each course card links to its detail page (see Task 6, slug-based).

**Acceptance:** Create "Test Course / 10 classes / 3999.50" in admin → appears on site immediately with correct values; edit and delete work.

---

## Task 4 — Doorstep scooty distance-based pricing

**Requirement (from client):**
- Up to **3 km → ₹4,500**
- More than 3 km → higher price, **maximum ₹8,000, up to 10 km**
- Admin panel has a **text box for the kilometre value**; the price is computed from it.

**Implement:**
- Admin "Doorstep Pricing" settings (Sheet tab `doorstep_pricing`, or rows in `settings`): `base_km` (3), `base_price` (4500), `max_km` (10), `max_price` (8000), `pricing_mode`.
- **Assumption to confirm with client:** between 3 km and 10 km, price increases **linearly** from 4500 to 8000 (i.e. ₹500 per extra km). Implement it as a configurable `per_km_extra` field = `(max_price - base_price) / (max_km - base_km)` = **500**, editable by admin. Show this assumption in the admin UI as helper text.
- Server function `calculateDoorstepPrice(km)`:
  - `km <= 0` or not a number → validation error
  - `km <= base_km` → `base_price`
  - `base_km < km <= max_km` → `min(max_price, base_price + ceil(km - base_km) * per_km_extra)`
  - `km > max_km` → reject with message "Doorstep service is available up to 10 km" (message text editable)
- Public endpoint `GET /api/doorstep/price?km=5` returns `{ km, price, currency }`. Use it on the public Doorstep section and booking flow (user types km → sees price live).
- All numbers must come from Sheets, not code constants.

**Acceptance:** 2 km → 4500; 3 km → 4500; 5 km → 5500 (with default config); 10 km → 8000; 11 km → clear error; admin changes config → API result changes.

---

## Task 5 — New section: DOORSTEP TRAINING

Place it **immediately after the Training/Programs section** on the home page.

**Default content (seed, all editable):**

- Heading: `DOORSTEP TRAINING`
- Subheading: `Learn to Ride. We Come to You.`
- Feature list (each with editable icon/emoji + text):
  - 🛵 Scooty + Bike Training
  - 📍 Up to 10 KM from Netaji metro
  - 👨‍🏫 Personal Trainer at Your Location
  - 📅 15-Session Standard Package
  - ⚙️ Customisable Duration & Schedule
- Short description: `Learn scooty or bike from the comfort of your own neighbourhood with personalised, one-on-one doorstep training.`
- Image (Cloudinary upload)

**Requirements:**
- Sheet tab `home_sections` (generic: `key, title, subtitle, description, image_url, features_json, link_slug, is_active, sort_order`) — reuse for Task 7 and other cards.
- Admin module "Doorstep Section": edit image, heading, subheading, feature list (add/remove/reorder), short description, active toggle.
- **Word/character limit to keep the card from breaking:** enforce `max 120 characters` for short description and `max 40 characters` per feature line in the admin form (live counter + block save), and also CSS-clamp on the public card (`line-clamp: 3` for description, `text-overflow: ellipsis` for titles, fixed image aspect ratio with `object-fit: cover`). Limits should be defined in one shared config.
- The whole card is clickable (Task 6).

---

## Task 6 — Standard "click card → detail page" feature

**Requirement:** Every content card/div (courses, doorstep, why-choose items, mission, etc.) opens a **new detail page** with its full description when clicked. Content for each page will be shared later, so build it as a reusable standard.

**Implement:**
- One generic detail page: `public/pages/detail.html` reading `?type=...&slug=...` **or** clean URLs `/p/:slug` served via `api/index.js` (add the route to `vercel.json`).
- Sheet tab `detail_pages`: `slug, title, hero_image_url, body_html, seo_title, seo_description, is_active, updated_at`.
- Each card has a `link_slug` field (Task 5 tab). If the slug's detail page is empty, show a friendly "Details coming soon" state (not a 404).
- Admin module "Detail Pages": list/create/edit/delete with the rich-text editor and image upload; slug auto-generated, editable, unique.
- Entire card is one accessible link (`<a>` wrapper, keyboard focusable, `aria-label`).
- Each detail page gets its own `<title>`, meta description, canonical URL, and is included in `sitemap.xml`.

**Acceptance:** Adding a new card in admin + a matching detail page requires zero code changes.

---

## Task 7 — Editable "Why Choose Seekho"

- Move all text to Sheets tab `why_choose` (`id, title, description, icon, is_active, sort_order`) plus section heading/subheading in `home_sections`.
- Admin module: edit section heading, add/edit/delete/reorder items, bold/normal via Task 2, character limits as in Task 5.
- Each item optionally clickable → detail page (Task 6).

---

## Task 8 — "Our Mission" details (new tab / page)

- On the details/about area, an **"Our Mission"** link/card opens a **new page in a new tab** (`target="_blank" rel="noopener"`).
- Content will be provided later → use the generic detail page (Task 6) with slug `our-mission`, seeded with placeholder text "Details coming soon".
- Editable from admin under Detail Pages.

---

## Task 9 — Deterministic chatbot (no LLM)

**Requirement:** A chatbot on the site that answers **primary details that are displayed on the website**. Must be deterministic (same question → same answer), and **editable from admin**.

**Implement:**
- Floating chat widget bottom-right (brand colour), mobile friendly, keyboard accessible, closeable.
- Sheet tab `chatbot_qa`: `id, question, keywords (comma separated), answer, category, is_active, sort_order`.
- Matching logic (server or client, pure functions, no external AI): lower-case, strip punctuation, tokenise, score each Q&A by keyword overlap + phrase match, return best if score ≥ threshold; otherwise return a **fallback message** (editable) with quick-reply buttons and the phone/WhatsApp contacts.
- Show **quick-reply chips** for top categories (Courses, Pricing, Doorstep, Timings, Location, Contact) — from the Sheet.
- Dynamic answers: for questions about price, classes, doorstep price by km, branch address/phone, answers should pull live values from the same Sheets data (use placeholders like `{{course:scooty-basic.price}}`, `{{doorstep.base_price}}`, `{{settings.phone}}`) so they never go out of date.
- Admin module "Chatbot": CRUD for Q&A, a **test box** ("type a question → see which answer matches and score"), and edit fallback text.
- Endpoint `POST /api/chatbot/ask { message }` with rate limiting. Log unanswered questions to a `chatbot_unanswered` tab so admin can add answers.

**Acceptance:** "What is the price of scooty training?" and "scooty course fees" return the same answer; unknown question returns fallback; changing a price in admin changes the chatbot answer.

---

## Task 10 — Google Business Profile (GMB) link + latitude/longitude

- Settings fields (admin → Settings, stored in `settings`): `gmb_url`, `latitude`, `longitude`, `map_embed_url` (optional), `address`.
- **Values will be provided by the client — leave empty with helper text, do not invent coordinates.**
- Public site: "Find us on Google" / "Get directions" button opens `gmb_url` in a new tab; if lat/lng are set, build the Google Maps directions link `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` and show the embedded map on the contact/branch section.
- Add lat/lng to the JSON-LD `LocalBusiness` schema (`geo`) and `hasMap` = GMB URL, `sameAs` includes GMB URL.
- Validate: latitude −90..90, longitude −180..180, URL must be https.
- Also allow per-branch lat/lng in the `branches` tab.

---

## Task 11 — "Updates" (fly-in / announcement) section

**Requirement:** An update/announcement section on screen where users see updates posted by admin. Content will be shared later.

**Implement (choose the interpretation below and mention it in the PR):**
- Sheet tab `updates`: `id, title, message, link_url, image_url, start_date, end_date, is_active, sort_order, created_at`.
- Public: a slim **announcement bar / slide-in card** ("fly-in") near the top or bottom-right showing active updates (auto-rotate, dismissible, remembers dismissal in `localStorage` per update id). Also a small "Latest Updates" list on the home page.
- Only show updates where today is between `start_date` and `end_date` and `is_active=true`.
- Admin module "Updates": CRUD, schedule dates, reorder, preview.

*(Client wrote "Attach a fly – update section"; if they meant a flyer/poster image, the `image_url` field covers that — ask them to confirm.)*

---

## Task 12 — Multiple blogs

- Admin already has a Blogs module; ensure **unlimited posts** can be created and managed: list with search, status (draft/published/scheduled), edit, delete, featured toggle.
- Public: `/blog` listing (pagination 9 per page, category filter) and `/blog/:slug` detail (already routed via `api/index.js`).
- Fields: `title, slug, excerpt, body_html (rich text), cover_image_url, author, category, tags, seo_title, seo_description, publish_at, status`.
- Each blog gets Open Graph tags, `BlogPosting` JSON-LD, canonical URL, and appears in `sitemap.xml`.
- Verify Cloudinary cover upload and Sheets write for multiple posts (batch writes to avoid Sheets API rate limits).

---

## Task 13 — Google SEO: page indexing

"GOOGLE SEO – Subsection operational page indexing added."

- `sitemap.xml` must dynamically include: home, courses, each active course/detail page, all published blogs, branches, contact — with `lastmod`.
- `robots.txt`: allow public pages, disallow `/admin/` and `/api/`, reference the sitemap.
- Per-page unique `<title>`, meta description, canonical, Open Graph/Twitter tags (from Sheets `seo_*` fields where present).
- Admin → Settings → "SEO" subsection: fields for site title, default meta description, Google Search Console verification meta tag, Google Analytics ID; and a **"Request indexing" helper** showing the sitemap URL and a link to Search Console (actual indexing requests are done in Search Console — do not try to automate this).
- Add `noindex` to draft/inactive pages and the admin.
- Ensure the JSON-LD is valid (test with Google Rich Results Test).

---

## Sheets schema summary (create via `npm run init-sheets`)

| Tab | New / changed | Key columns |
|---|---|---|
| `pricing` (courses) | changed | id, name, slug, description, price, classes, image_url, badge, is_active, sort_order |
| `doorstep_pricing` | new | base_km, base_price, max_km, max_price, per_km_extra, out_of_range_message |
| `home_sections` | new | key, title, subtitle, description, image_url, features_json, link_slug, is_active, sort_order |
| `detail_pages` | new | slug, title, hero_image_url, body_html, seo_title, seo_description, is_active |
| `why_choose` | new | id, title, description, icon, is_active, sort_order |
| `chatbot_qa` | new | id, question, keywords, answer, category, is_active |
| `chatbot_unanswered` | new | id, message, created_at |
| `updates` | new | id, title, message, link_url, image_url, start_date, end_date, is_active |
| `settings` | changed | + gmb_url, latitude, longitude, map_embed_url, address, seo fields |
| `blogs` | changed | + status, publish_at, category, tags, seo fields |

## Open questions for the client (do not block on these; use the stated defaults)

1. Doorstep price between 3 km and 10 km — linear ₹500/km assumed. Confirm the exact slab or formula.
2. GMB link and latitude/longitude — to be provided.
3. Content for detail pages, Our Mission, and Updates — to be provided.
4. "Fly – update section" — announcement bar/slide-in assumed; confirm if a flyer/poster is intended.
5. "Kolkata scooty" file name suggests a Kolkata-specific branch — confirm whether doorstep pricing is per branch.

# Phase 8 — Go-Live Report

**Project:** Seekho 2 Wheeler  
**Production URL:** https://seekho2wheeler.vercel.app  
**Date:** 2026-10-03  

## Commit

Phase 8 commit (this report + go-live fixes): see `git log -1` after commit.  
Phase 7 baseline: `5ebc3559c9cdac953df666500918ea4e97752c50`

## Production URL

https://seekho2wheeler.vercel.app  

## Environment Variables

| Variable | Purpose | Required in production? | Where consumed | Fallback |
|---|---|---|---|---|
| `BASE_URL` | Canonical / sitemap / robots / schema absolute URLs | **Yes** | `server/config`, sitemap, robots, renderers | Defaults to `https://seekho2wheeler.vercel.app` |
| `GOOGLE_SHEETS_ENABLED` | Use Sheets as primary DB | **Yes** | `server/config`, `db.js` | Local JSON (dev only; not for prod writes) |
| `GOOGLE_SHEETS_ID` | Spreadsheet ID | **Yes** | Sheets client | None — Sheets not ready |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Vercel preferred creds | **Yes** (one of A/B/C) | `googleAuth.js` | File / email+key modes |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` | Creds mode A | Alternative | `googleAuth.js` | — |
| Service account file / `GOOGLE_APPLICATION_CREDENTIALS` | Creds mode B | Alternative | `googleAuth.js` | — |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Admin media uploads | **Yes** for uploads | `upload.js`, health | Local `/uploads` (not on Vercel) |
| `CLOUDINARY_FOLDER` | Cloudinary folder prefix | No | `upload.js` | `seekho` |
| `GOOGLE_MAPS_EMBED_KEY` | Place-mode map embeds | No | `mainBranch.js` | Keyless name+address embed |
| `JWT_SECRET` | Admin auth | **Yes** | auth middleware | Dev default (unsafe) |
| `JWT_EXPIRES_IN` | Token TTL | No | auth | `8h` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin | Yes on first boot | auth seed | Dev defaults |
| `WHATSAPP_NUMBER` | Default WhatsApp | No | config contact | `9748481630` |
| `SMTP_*` / `NOTIFY_EMAIL` | Email notifications | No | mailer | Disabled if empty |
| `PORT` / `NODE_ENV` / `VERCEL` | Runtime | Auto on Vercel | app / config | Express defaults |

`.env.example` updated with a Phase 8 production checklist (no secrets).

## Google Sheets Sync

- **Executed:** YES  
- **Timestamp:** 2026-10-03 (local run with production Sheet credentials)  
- **Command:** `GOOGLE_SHEETS_ENABLED=true BASE_URL=https://seekho2wheeler.vercel.app npm run sync-content`  
- **Result:** PASS  
- **Rows created:** blogs `0`, chatbot_config `0`, chatbot_qa `0`  
- **Rows updated:** blogs `6`, chatbot_config `1`, chatbot_qa `14`  
- **Settings:** already up to date (placeholder merge; no delete)  
- **Duplicates:** none observed (upsert by slug/id)  
- **Failures:** none  
- **Note:** Sync is idempotent; never deletes unrelated Sheet rows.

## Cloudinary

- **Status:** PASS (production `/api/health` reports `cloudinaryReady: true`, `mediaStorage: cloudinary`)  
- Customer images continue via Sheets-stored HTTPS URLs + local `/images/*` fallbacks where seeded.  
- No fabricated image URLs added in Phase 8.

## Google Maps

- **Status:** PASS (code + live location pages)  
- Main Branch Place ID: `ChIJTW1jJIZxAjoR5lZey5JaXcY` (Tollygunge only) — confirmed on live `/locations/tollygunge`  
- Barasat: Lalit Cinema — confirmed  
- Rabindra Sarobar: Swiss Park, opposite Bhawani Cinema — confirmed  
- `GOOGLE_MAPS_EMBED_KEY` not set locally; keyless embed fallback remains active  

## Robots

- **Status:** PASS  
- Live `/robots.txt`: Allow `/`, Disallow `/admin/` + `/api/`, Sitemap `https://seekho2wheeler.vercel.app/sitemap.xml`  
- No localhost / preview sitemap URL  

## Sitemap

- **Status:** PASS (after production redeploy)  
- Live URL count: **34**  
- Includes: home, courses listing, **5** course details, **7** locations, women-training, blog listing, **6** articles, other customer pages  
- No localhost, no duplicates, HEAD checks on sample URLs returned 200  

## SEO Meta

- **Status:** PARTIAL  
- **PASS:** Homepage, courses (5), locations (7), booking, contact, about, gallery, blog listing — unique titles, production canonicals, OG titles present  
- **PARTIAL:** Blog **detail** shells still ship generic static `<title>` / canonical `/blog/` until client JS hydrates (SPA-style detail). Crawlers without JS may see weaker per-article meta. Architecture retained (do not rebuild Phase 6).  
- Women page meta description is present in SSR (audit regex false-shortened on apostrophe).  

## Structured Data

- **Status:** PASS (with note)  
- Homepage / contact / branches: LocalBusiness  
- Courses: Course + BreadcrumbList  
- Locations: LocalBusiness + FAQPage + BreadcrumbList  
- Women: WebPage + BreadcrumbList  
- Blog detail: BlogPosting + BreadcrumbList injected client-side after load  
- Phase 8 fix: client schema updater now forces JSON-LD `telephone` to official phones only (blocks `7980110273`)  
- No fake ratings invented in Phase 8  

## Phone Audit

- **Status:** PASS (after redeploy)  
- Official: `9748481630`, `7980108587`  
- Old `7980110273`: present only in intentional blocklists (settings/chatbot/app.js/sync)  
- Live homepage after deploy: **old phone absent**; both official numbers present  
- Settings API: official phones only  

## Social Links

- **Status:** PASS  
- Instagram / Facebook / YouTube match Phase 2 approved URLs via `/api/settings`  
- Footer/Stay Connected use settings + `target="_blank"` / `rel="noopener"` patterns already in layout  

## Customer Theme

- **Status:** PASS (no Admin theme changes in Phase 8)  
- Customer pages continue on `customer-theme.css` + main CSS  
- Unrelated dirty logo/clear-asset work **not** included in Phase 8 commit  

## Responsive Testing

- **Status:** PARTIAL  
- Local smoke of Phase 1–7 routes: PASS at code level  
- Production Chrome headless screenshot capture in this session: **NOT RUN reliably** (0-byte files from path/tooling); DOM/API/page HTTP checks used instead  
- Sticky CTA + chatbot positioning previously verified in Phase 7; production chatbot CTAs live after deploy  

## Functional Smoke Tests

| Area | Status | Evidence |
|---|---|---|
| Homepage | PASS | 200, old phone gone |
| Courses (exactly 5) | PASS | `/api/courses` n=5; detail pages 200 |
| Doorstep prices | PASS | 1→4500, 3→4500, 3.2→5000, 4→5000, 8→7000, 10→8000, 10.5 unavailable (local calc + prod config) |
| Locations (7) | PASS | All `/locations/*` 200; landmarks OK; Tollygunge Place ID OK |
| Women | PASS | `/women-training` 200; legacy `/p/women-empowerment` → **301** |
| Blogs (6) | PASS | API lists 6; Article 6 live; sitemap includes all |
| Chatbot | PASS | Centres/courses/women/fallback CTAs; no old phone; Scooty→Bike not auto-promised |
| Booking | PASS | Page 200; `?course=basic-scooty` loads |

## Console / Network Errors

- **Status:** PARTIAL  
- Production HTTP smoke: no 4xx/5xx on required customer routes after deploy  
- Full browser console capture across all viewports: **NOT RUN** end-to-end in this session  
- Known: blog detail relies on client fetch (expected)  

## Search Console Readiness

**MANUAL ACTION REQUIRED**

1. Open Google Search Console for `https://seekho2wheeler.vercel.app`  
2. Verify property ownership if not already verified  
3. Confirm `https://seekho2wheeler.vercel.app/robots.txt`  
4. Confirm `https://seekho2wheeler.vercel.app/sitemap.xml`  
5. Submit sitemap  
6. URL Inspection: home, `/courses/*`, `/locations/*`, `/women-training`, key `/blog/*`  
7. Request indexing for new Phase 3–7 URLs  

Search Console verification/submission was **not** performed by the agent.

## Regression Phase 1–7

| Phase | Live after redeploy |
|---|---|
| 1 Doorstep / phones / stats | PASS |
| 2 Main branch / social / robots / sitemap BASE_URL | PASS |
| 3 Seven locations + landmarks | PASS |
| 4 Five courses + details | PASS |
| 5 Women + 301 | PASS |
| 6 Six blogs + Article 6 | PASS |
| 7 Chatbot CTAs / fallback | PASS |

## Git Status

Phase 8 commit includes only go-live artefacts + phone schema hardening + `.env.example` checklist + this report.  

**Intentionally excluded dirty work:** clear logo assets, `customer-theme.css`, `layout.js`, favicon/brand binary overwrites, `make-clear-logos.js`, `tmp/` / `scripts/tmp/`.

## Remaining Issues

1. **Push GitHub `swetha/main`:** local branch was **9 commits ahead** of `swetha/main` before deploy; Vercel was updated via CLI deploy. Push/merge to `r-swetha1473/seekho2wheeler` so GitHub matches production.  
2. **Blog detail SSR meta:** article pages still use client-side meta/schema updates (generic shell HTML for non-JS crawlers).  
3. **`GOOGLE_MAPS_EMBED_KEY`:** optional; not required, but set on Vercel for official place-mode embeds.  
4. **Accidental extra Vercel project:** a one-off CLI deploy temporarily created `seekho-two_wheelers`; production traffic remains on **`seekho2wheeler`**. Safe to ignore/delete the accidental project.  
5. **Search Console:** submit sitemap + request indexing (manual).  

## Final Decision

**GO LIVE READY** — with manual Search Console + GitHub sync follow-ups listed above.

# Seekho Two Wheeler Academy — Product Requirements

> Stored from the implementation brief (Oct 2026). Treat this file as the source of truth for remaining phases.
> If a fact is not written here, do not invent it.

See the full Phase 1–8 brief in the project conversation / product owner message.
Key ambiguities (RESOLVED for Phase 3):

1. Barasat landmark: **Lalit Cinema** (confirmed)
2. Rabindra Sarobar landmark: **Swiss Park, opposite Bhawani Cinema** (confirmed)

## Phase 1 status (implemented in code)

- Doorstep: client-side calc from cached `/api/doorstep/config`; server 10-min cache; defaults fallback
- Phones: only `9748481630` and `7980108587` (filtered server + client)
- Stats third card: `5000+ Candidates Trained` via `trainedCandidates` + new page-copy slots
- Rating badges: `min-width:0`, stretch, single column ≤360px
- Empower grid: single column ≤600px (override duplicate CSS)
- Hero overlay: subtle 0.10→0.34 vertical wash + text-shadow + lower-middle content

## Phase 2 status (implemented in code)

- Main Branch SSOT: `server/config/mainBranch.js` (name, Place ID, address, maps search/embed, social defaults)
- Public settings API forces Main Branch address/maps + resolves placeholder socials
- Client schema updater never flattens structured Main Branch address
- Footer + Stay Connected social links (icons, new tab); Admin Settings editable
- `robots.txt` + `sitemap.xml` use `BASE_URL` / `config.baseUrl`; location + women-training paths listed
- `scripts/sync-content.js` idempotent Sheets upsert for settings (never deletes)

## Phase 3 status (implemented in code)

- Location SSOT: `server/content/locations.js` (7 centres)
- Server-rendered `/locations/:slug` pages with unique SEO + LocalBusiness/FAQPage/BreadcrumbList
- Gallery categories `Branch: <Name>` in Admin Gallery
- Homepage / branches / footer / contact / about copy updated to seven locations
- Chatbot `{{branches.list}}` + branch detail placeholders use location SSOT
- Sitemap location URLs derived from SSOT
- Patuli course list not invented (confirm on book/call)

## Phase 4 status (implemented in code)

- Course SSOT: `server/content/courses.js` (exactly 5 courses)
- Server-rendered `/courses/:slug` with Phase → Classes/Timing → What You Learn → Goal (+ Doorstep Steps 1–6)
- Listing via `/api/courses`; homepage/courses page use catalog (not legacy 6-course set)
- Booking preselect via `?course=` using catalog slugs; doorstep calculator unchanged
- Chatbot course answers from course SSOT
- Sitemap includes `/courses/*`

## Phase 5 status (implemented in code)

- Women's Training SSOT: `server/content/womenTraining.js`
- Canonical page: `/women-training` (legacy `/p/women-empowerment` → 301)
- Homepage keeps exact headline "Freedom Begins With Your First Ride" + 6 line-icon benefit cards
- Gallery category: `Women Riders` via existing Admin Gallery API
- Only statistic: "Around 70% of our candidates are women"
- Final CTA: "Ready to Start Your First Ride?" / "Book Ladies Training" → existing booking

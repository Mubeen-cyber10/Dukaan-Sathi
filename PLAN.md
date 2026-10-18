# Dukaan Saathi – Rebuild Strategy & Architecture

## 1. Brand & Aesthetic Architecture (DigiKhata Warm Orange)
- **Primary Color Scheme**:
  - Light: `--bg: #FFF8F2`, `--surface: #FFFFFF`, `--surface-2: #FFF1E6`, `--primary: #F47A20`, `--primary-hover: #DB660F`, `--primary-soft: #FFE6D2`, `--on-primary: #FFFFFF`, `--text: #1F1A17`, `--text-muted: #6B5F57`, `--border: #F1E3D6`, `--success: #12A150` (received), `--danger: #D92D20` (due)
  - Dark: `--bg: #15100C`, `--surface: #1F1813`, `--surface-2: #2A2019`, `--primary: #FF8A3D`, `--primary-hover: #FFA05F`, `--primary-soft: #3A2413`, `--on-primary: #1A0E05`, `--text: #F6EEE8`, `--text-muted: #B9A99C`, `--border: #3A2D24`, `--success: #3DD68C`, `--danger: #FF7A6E`
- **Typography**: `Inter` font loaded via Google Fonts with `font-variant-numeric: tabular-nums` for currency values.
- **Theme Persistence**: `js/theme.js` loaded synchronously in `<head>` preventing flash of unstyled theme (FOUC).

## 2. Multi-Page Structure
### Public Marketing Site (Top Fixed Sticky 68px Navbar)
- `index.html`: Hero with phone mockup khata preview, count-up stat counters, 3-step onboarding, testimonials, FAQ accordion, CTA band, footer.
- `features.html`: 6 core feature cards with modal detail views.
- `pricing.html`: Monthly/Yearly toggle changing prices with animation, 3 plan cards (Standard highlighted), feature comparison table.
- `security.html`: Tenant isolation, append-only khata, actor audit trail, and 6-digit MFA cards.
- `login.html`: Split orange brand hero + form panel with floating/clean inputs, password eye toggle, 6-digit MFA OTP input with auto-advance & paste support, forgot password modal.

### Application Shell (Shop Owner Portal: CSS Grid `260px sidebar | main`)
- `app-dashboard.html`: Greeting, 4 clickable summary cards with deep links (`?filter=due` / `?filter=settled`), weekly collections SVG/CSS bar chart, quick actions, recent audit list.
- `app-khata.html`: Customer search, filter chips, sort dropdown, desktop table / mobile cards, append-only timeline drawer (no edit/delete buttons!), 2-step new entry modal with note counter, 500ms skeleton loader simulation.
- `app-orders.html`: 6-state status tabs (`Placed` &rarr; `Confirmed` &rarr; `Packed` &rarr; `Out for delivery` &rarr; `Delivered`), order cards, detail modal, advance status button enforcing valid state transitions.
- `app-inventory.html`: Stock grid/table with `Low Stock` threshold badges, category filter, add-product modal.
- `app-reports.html`: Analytics date-range chips (7d/30d/90d), KPI cards, top debtor table, full audit stream.

## 3. Data Integrity & Persistence
- Data API (`js/data.js`) synced via `localStorage` with mock fallback for Pakistani shop dataset (`Bismillah General Store`, Multan).
- Money values formatted as `Rs. X,XXX`.
- Phone numbers masked as `0300-***-**45`.

## 4. Security & Compliance
- `// Hiding UI is not a security control; real enforcement relies on server-side backend rules.`
- `vercel.json` configured with static headers (`nosniff`, `DENY` frame, `XSS-Protection`).
- Dynamic text rendered cleanly via `textContent`.

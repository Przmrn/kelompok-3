# Karsa Studio — Frontend UI/UX Design Specification

> Design documentation for the Karsa course-registration app.
> Covers the 2026 campaign system, tokens, layout, components, every route, responsive
> behaviour, accessibility and the implementation map.
>
> **App:** `karsa.` — *Kursus Tatap Muka* (in-person tech courses, Jakarta & Bandung)
> **Stack:** Angular 17 (standalone components, signals) · Bootstrap 5.3 · Bootstrap Icons 1.13
> **Language:** Indonesian UI copy, `lang="id"`, `LOCALE_ID = id-ID`
> **Documented from:** `FrontEnd/src` (styles, templates, component CSS)

---

## 1. Product context

Karsa is a **catalog + registration + payment** platform for offline technology classes.
Three roles share one shell but see different navigation and pages:

| Role | Session value | UI value | Entry route | Purpose |
|------|---------------|----------|-------------|---------|
| Guest | — | — | `/courses` | Browse classes, open the auth modal |
| Peserta | `STUDENT` | `Student` | `/courses` | Buy classes, pay, manage schedule, refunds, profile |
| Pengajar | `INSTRUCTOR` | `Instructor` | `/teaching-schedule` | View assigned teaching schedule |
| Admin | `ADMIN` | `Admin` | `/admin/dashboard` | Manage classes, batches, instructors, revenue |

`AuthService` stores the uppercase enum value in `sessionStorage`, then maps it through
`LETTER_TO_ROLE` to the title-case value the rest of the app reads (`role()`, `isStudent()`,
`isAdmin()`, `isInstructor()`).

Core journeys:

1. **Discover** — catalog → filter by category → course detail.
2. **Register** — pick batch → price breakdown (early-bird tier + PPN 11%) → login/profile gate → checkout.
3. **Pay** — upfront or 0% installment (3/6/12 months) → cart or immediate payment → payment detail.
4. **Manage** — *Kelas saya* (schedule, location, instructors), cancel with refund preview, profile completeness.

The UI is single-page and state-driven. Auth and notifications render as overlays around a
persistent header/footer; pages are thin templates composed from global primitives plus Bootstrap utilities.

---

## 2. Design direction

**Concept:** a *campaign poster crossed with a studio dashboard*. Black type on white paper,
one electric blue for action, one rust orange for emphasis, and a lime highlighter for
confirmation. Editorial scale, editorial confidence, zero decoration for decoration's sake.

| Principle | How it shows up |
|-----------|-----------------|
| Big type, honest content | 44–64 px display headings with tight tracking; no invented statistics |
| One action colour | Bolt blue for every primary action, link and active state |
| Ember is emphasis | Section kickers, inline price/schedule icons, destructive confirm |
| Lime is proof | Seat counts, success pills, totals on black, check marks |
| Pastel = grouping | Mist / ice / bloom / bone separate repeated cards without adding chrome |
| Black = authority | Trust band, registration summary, receipt, toast, footer marks |
| Hairlines, not boxes | 1 px borders, 14–28 px radii, shadows only as hover lift or overlay depth |
| Motion with intent | 2–6 px lifts and 450–500 ms springs; nothing loops except the status dot |

**Personality in one line:** a design studio's course poster that happens to be a working
booking system.

---

## 3. Technology foundation

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Angular 17.3 | Standalone components, `signal`/`computed`, `@if` / `@for` |
| CSS framework | Bootstrap 5.3.9 | Grid, utilities, dropdown, modal base, form base |
| Icons | Bootstrap Icons 1.13.2 | Font-based, global |
| Global CSS | `src/styles.css` | Tokens, primitives, motion, app-wide page system |
| Component CSS | `app.component.css`, `catalog-page.component.css`, `instructors-page.component.css` | Shell, landing page, skill chips |
| Fonts | Self-hosted `woff2` in `src/assets/fonts` | Preloaded in `index.html`, no Google Fonts request |

`angular.json` loads, in order:

```
node_modules/bootstrap/dist/css/bootstrap.min.css
node_modules/bootstrap-icons/font/bootstrap-icons.css
src/styles.css
```

`styles.css` loads last, so the `k-*` primitives intentionally override Bootstrap defaults.

**Document metadata:** `<html lang="id">`, title `Karsa — Kursus Tatap Muka`,
`meta name="description"`, `meta name="theme-color" content="#ffffff"`, preloads for
`inter.woff2` and `nanum-pen-script.woff2`.

---

## 4. Design tokens

All tokens live in `:root` in `src/styles.css`.

### 4.1 Colour

#### Surfaces and ink

| Token | Value | Role |
|-------|-------|------|
| `--ui-paper` | `#ffffff` | Page, cards, header, footer |
| `--ui-bone` | `#f1f0ec` | Soft panels, ops rows, nav track, light buttons |
| `--ui-mist` | `#ebdcff` | Card tone 0, selected batch |
| `--ui-ice` | `#d6e0ff` | Card tone 1 |
| `--ui-bloom` | `#c293f1` | Card tone 2 (darkest pastel, black text only) |
| `--ui-ink` | `#000000` | Text, black panels, borders |
| `--ui-graphite` | `#333333` | Body copy, metadata |
| `--ui-smoke` | `#555555` | Secondary copy |
| `--ui-stone` | `#d1d5db` | Secondary copy on black |
| `--ui-hairline` | `#e5e7eb` | 1 px borders |
| `--ui-navy` | `#193f78` | Trust-band stat tile 1 |
| `--ui-sage` | `#244f47` | Trust-band stat tile 2 |

#### Brand and state

| Token | Value | Role |
|-------|-------|------|
| `--ui-bolt` | `#3259e6` | Primary action, links, active chip, focus ring |
| `--ui-bolt-hover` | `#2748c4` | Primary hover |
| `--ui-ember` | `#c2410c` | Kickers, accent icons, pay/destructive action |
| `--ui-ember-hover` | `#9a3412` | Ember hover |
| `--ui-lime` | `#c6ff94` | Success fills, totals on black, highlighter |
| `--ui-success` | `#15803d` | Inline positive delta |
| `--ui-warning` | `#b45309` | Inline warning |
| `--ui-error` | `#b91c1c` | Inline error |

#### Legacy alias layer

Templates written before the 2026 redesign still reference brand-sounding names. They are kept
as aliases so nothing breaks, but they no longer describe their hue:

| Alias | Resolves to | Meaning |
|-------|-------------|---------|
| `--iris` | `#3259e6` | Same as `--ui-bolt` |
| `--iris-hover` | `#2748c4` | Same as `--ui-bolt-hover` |
| `--lavender` | `#ebdcff` | Same as `--ui-mist` |
| `--lavender-soft` | `#f4ecff` | Soft mist tint |
| `--mint` | `#c6ff94` | Same as `--ui-lime` |
| `--mint-soft` | `#eefbe3` | Soft lime tint |
| `--brand-forest` | `#000000` | Ink |
| `--brand-coral` | `#3259e6` | Bolt (historical name) |
| `--brand-lime` | `#ebdcff` | Mist (historical name) |
| `--brand-amber` | `#b45309` | Warning |
| `--bg-page` | `#ffffff` | Page |
| `--bg-subtle` | `#f1f0ec` | Bone |
| `--text-main` | `#000000` | Ink |

> ⚠️ The old caveat — "coral is purple, lime is lavender" — is gone. Coral is now rust ember,
> lime is highlighter green, forest is black. New code should use `--ui-*`.

#### Status pills

| State | Background | Text | Class |
|-------|-----------|------|-------|
| Confirmed · paid · open · complete | `--ui-lime` `#c6ff94` | `#000` | `.k-pill-green` |
| Pending · partial · incomplete | `#fdebd5` | `#8a3b0f` | `.k-pill-amber` |
| Cancelled · failed · overdue · full | `#fee2e2` | `#991b1b` | `.k-pill-red` |
| Neutral meta | `--ui-bone` `#f1f0ec` | `--ui-graphite` `#333` | `.k-pill-neutral` |
| Disabled control | `#e7e7e7` | `#6b6b6b` | `:disabled` |

### 4.2 Typography

| Token | Stack | Usage |
|-------|-------|-------|
| `--ui-font` | `"Inter", "DM Sans", "Segoe UI", sans-serif` | Everything: display, body, UI, numbers |
| `--ui-script` | `"Nanum Pen Script", cursive` | The single handwritten accent line on the landing hero |
| `font-serif-italic` exception | `"Spectral", Georgia, serif` | Legacy italic helper only |

Font files (`@font-face`, all `font-display: swap`):

| Family | File | Weight / style |
|--------|------|----------------|
| Inter | `inter.woff2` | 100–900 variable, normal |
| Nanum Pen Script | `nanum-pen-script.woff2` | 400, normal |
| DM Sans | `dm-sans.woff2` | 100–1000 variable, normal (fallback) |
| Spectral | `spectral-bold.woff2` | 700, normal (legacy) |
| Spectral | `spectral-semibold-italic.woff2` | 600, italic (legacy) |

Global type rules:

```css
body {
  font-family: var(--font-main);   /* Inter */
  font-size: 1rem;
  line-height: 1.6;
  background: #ffffff;
  color: #000000;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6, .font-display {
  font-family: var(--ui-font);
  font-weight: 700;
  letter-spacing: -0.035em;
  color: #000;
}

.font-mono {
  font-family: var(--ui-font);        /* NOT monospace */
  font-variant-numeric: tabular-nums; /* aligned prices */
}
```

Effective scale:

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Landing H1 | `clamp(2.6rem, 5.6vw, 4.4rem)` | 700 | `-0.05em`, line-height 1.02 |
| Page title (`.page-title`) | `clamp(2rem, 4.2vw, 3rem)` | 700 | `-0.045em`, line-height 1.02 |
| Detail title | `clamp(2rem, 4vw, 3rem)` | 700 | `-0.045em` |
| Section headline | `clamp(1.6rem, 2.8vw, 2.4rem)` | 700 | `-0.04em` |
| Panel title | `1.12rem` | 700 | `-0.025em` |
| Stat value | `clamp(1.7rem, 3vw, 2.3rem)` | 700 | `-0.04em`, tabular |
| Total on black | `1.6–1.7rem` | 700 | `-0.03em`, tabular |
| Body | `14.5px` | 400 | line-height 1.6 |
| Lede / description | `14.5–15px` | 400 | line-height 1.65, smoke |
| Meta / caption | `11–12.5px` | 400–600 | line-height 1.5 |
| Kicker | `11px` | 700 | `0.12em`, uppercase, ember |
| Pill | `0.7rem` | 700 | `0.02em` |
| Button | `0.9–0.92rem` | 600 | — |
| Label | `0.82rem` | 600 | — |
| Input | `0.95rem` | 400 | — |

### 4.3 Radius, borders, elevation

| Value | Applied to |
|-------|------------|
| `999px` | Buttons, pills, chips, nav track, header controls, avatar |
| `28px` | `.k-band`, landing closing CTA |
| `24px` | `.summary-panel`, `.k-modal-dialog` |
| `20px` | `.panel`, `.receipt`, page cards |
| `18px` | `.admin-card` |
| `16px` | `.k-card`, `.batch-option`, `.stat-tile`, `.empty-icon` |
| `14px` | `.summary-box`, `.cost-box`, `.ops-row`, `.schedule-row`, inset panels |
| `12px` | Inputs, selects, `.k-surface-soft`, receipt tiers |
| `10px` | `.assignment-row` |

- Default border is `1px solid var(--ui-hairline)` (`#e5e7eb`).
- Pastel cards tint their border: mist `#dcc8f5`, ice `#c3d2f7`, bloom `#ad7ce8`, lime `#a9ef63`.
- Selection uses a 2 px black border (`.batch-option.is-selected`).
- Shadows are reserved for hover lift (`0 18px 40px -24px rgba(0,0,0,.22)`), overlays
  (`0 32px 64px -28px rgba(0,0,0,.45)`) and the toast.
- z-index: header `1030`, toast `1080`, auth modal `1090`.

### 4.4 Motion

| Name | Definition | Use |
|------|------------|-----|
| `springUp` | `.55s cubic-bezier(.22,1,.36,1)` — fade + 22 px rise + scale .98 → 1 | Page blocks, cards, `.anim-fade-up` |
| `popIn` | `.32s cubic-bezier(.22,1,.36,1)` — fade + scale .96 → 1 | Modal, inline forms, `.anim-pop` |
| `floatSlow` | `4s ease-in-out infinite` — ±5 px drift | Decorative hero chip only |
| `pulseDot` | `2s infinite` — scale + bolt halo | Profile-incomplete dot in the header |

Stagger helpers `.delay-1` … `.delay-4` add 60 ms each. Dynamic lists use
`[style.animation-delay.ms]="idx * 55…70"`.

Transitions: buttons 200 ms + `translateY(-2px)`; cards 260 ms + `translateY(-3–4px)`;
chips 200 ms; inputs border + 4 px bolt halo on focus.

Reduced motion completely disables animation:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

### 4.5 Iconography

Bootstrap Icons, always `aria-hidden="true"` when paired with visible text. Recurring meanings:
`bi-cart3` cart · `bi-box-arrow-in-right` sign in · `bi-arrow-right/left` forward/back ·
`bi-calendar3` schedule · `bi-geo-alt` location · `bi-clock` duration ·
`bi-credit-card-check` pay · `bi-check2-all` empty success · `bi-receipt` payment ·
`bi-journal-bookmark-fill` my classes · `bi-person` profile · `bi-x-circle` remove assignment.

### 4.6 Focus

```css
:where(a, button, input, select, textarea):focus-visible {
  outline: 3px solid var(--iris); /* bolt */
  outline-offset: 3px;
}
```

Inputs also get `border-color: var(--iris)` and `box-shadow: 0 0 0 4px rgba(50,89,230,.18)`.

---

## 5. Layout

### 5.1 Shell and widths

Every route uses the same shell: **1200 px max width, 24 px gutters (18 px ≤ 767 px)**.

```html
<header class="sticky-top k-header">…</header>
@if (authModalOpen) { <div class="k-modal-backdrop">…</div> }
<main style="min-height: calc(100vh - 220px)"> <router-outlet/> </main>
<footer class="k-footer">…</footer>
```

`.k-header .container, .k-footer .container { max-width: 1200px }`.
Page content uses:

```html
<section class="k-page">
  <div class="shell"> … </div>
</section>
```

| Class | Behaviour |
|-------|-----------|
| `.shell` | 1200 px cap, centred, 24/18 px inline padding |
| `.k-page` | `padding-block: clamp(32px,4vw,56px) clamp(48px,6vw,80px)` |
| `.page-head` | flex row, space-between, wraps; stacks ≤ 767 px |
| `.page-head-copy` | max 660 px |
| `.page-actions` | wrapping button group |

Sticky checkout/summary panels use `top: 96px` (header ≈ 76 px + breathing room) and drop to
static ≤ 1023.98 px.

### 5.2 Breakpoints

| Width | Effect |
|-------|--------|
| `≤ 1100px` | Landing course grid 4 → 2; trust band stacks |
| `≤ 1023.98px` | `detail-layout` / `checkout-layout` → 1 column; stat grid 4 → 2 |
| `≤ 991.98px` | Nav collapses; nav track loses its pill shell; footer links wrap |
| `≤ 900px` | Method comparison 2 → 1 |
| `≤ 767.98px` | Page head stacks; shell gutters 18 px; admin grid 1 column; fact grid 1 column |
| `≤ 575.98px` | Landing grid 1 column; stat grid stays 2; buttons go full width in hero/actions; schedule rows stack |

### 5.3 Grid recipes

| Recipe | Definition |
|--------|------------|
| Landing catalog | `repeat(4, minmax(0,1fr))` → 2 ≤ 1100 → 1 ≤ 575 |
| Trust band stats | `repeat(2, minmax(0,1fr))`, 12 px gap, `min-width: 340px` |
| Course detail `.detail-layout` | `minmax(0,1.5fr) minmax(320px,.9fr)`, 24–40 px gap |
| Checkout `.checkout-layout` | `repeat(2, minmax(0,1fr))`, 20 px gap |
| Stat tiles `.stat-grid` | 4 columns → 2 ≤ 1023 → 2 ≤ 575 |
| Stat triad `.stat-grid--3` | 3 columns → 3 ≤ 1023 → 2 ≤ 575 |
| Admin `.admin-grid` | 2 columns → 1 ≤ 767 |
| Facts `.fact-grid` | 3 columns → 1 ≤ 767 |
| Forms | Bootstrap `row g-3`; profile 6/6, 12, 4/4/4, 6/6; course 5/3/2/2; batch 4/4/4 + 3/3/2/2/2 |

### 5.4 Route map

| Route | Component | Guard |
|-------|-----------|-------|
| `/courses` | `CatalogPageComponent` | — |
| `/courses/:id` | `CourseDetailCheckoutComponent` | — |
| `/checkout/:batchId` | `CheckoutPaymentPageComponent` | — |
| `/cart` | `CartPageComponent` | — |
| `/my-courses` → `jadwal` | `MyRegistrationsComponent` + schedule tab | — (login prompt) |
| `/my-courses/:registrationId/refund` | refund tab | — |
| `/payments/:registrationId` | `PaymentDetailPageComponent` | — |
| `/profile` | `ProfileAuthPageComponent` | — |
| `/teaching-schedule` | `TeachingScheduleComponent` | `instructorScheduleGuard` |
| `/admin/dashboard` | `AdminDashboardComponent` | `adminOnlyGuard` |
| `/admin/courses` | `AdminCoursesComponent` | `adminOnlyGuard` |
| `/admin/batches` | `AdminBatchesComponent` | `adminOnlyGuard` |
| `/admin/instructors` | `InstructorsPageComponent` | `adminOnlyGuard` |

---

## 6. Component library

### 6.1 Page system

```html
<header class="page-head anim-fade-up">
  <div class="page-head-copy">
    <span class="kicker">Admin</span>
    <h1 class="page-title">Kelola kelas</h1>
    <p class="page-lede">Atur nama kelas, harga, durasi, dan materi.</p>
  </div>
  <div class="page-actions">
    <span class="k-pill k-pill-neutral">4 kelas</span>
    <button class="btn-k-primary">+ Tambah kelas</button>
  </div>
</header>
```

- `.kicker` — ember, 11 px, uppercase, `0.12em`.
- `.page-title` — Inter 700, tight tracking, 1.02 line-height.
- `.page-lede` — smoke, 14.5 px, max 620 px.

### 6.2 Panel

`.panel` — white, 1 px hairline, 20 px radius, `clamp(20px,2.6vw,28px)` padding.
Tones: `.panel--bone`, `.panel--mist`, `.panel--ice`, `.panel--lime`, `.panel--ink`.
Ink panels flip headings to paper, secondary copy to stone, success to lime, danger to `#fca5a5`.
Companions: `.panel-title`, `.panel-sub`, `.panel-head` (flex header with 18 px bottom gap).

### 6.3 Stat tiles

```html
<div class="stat-grid">
  <div class="stat-tile stat-tile--mist">
    <span class="stat-label">Total kelas</span>
    <span class="stat-value">4</span>
    <span class="stat-note">4 kategori kelas</span>
  </div>
  …
</div>
```

Tones: `.stat-tile--ink` (black, lime value + lime note), `--mist`, `--ice`, `--lime` (dark green
labels for contrast), default white.

### 6.4 Black band

`.k-band` — black, 28 px radius, `clamp(24px,3.4vw,40px)` padding, lime radial glow top-right.
Kicker turns lime; paragraphs stone. Used for the landing trust band and closing CTA.

### 6.5 Buttons

| Class | Fill | Text | Use |
|-------|------|------|-----|
| `.btn-k-primary` | bolt `#3259e6` | white | Main action, continue, save |
| `.btn-k-coral` | ember `#c2410c` | white | Pay, confirm registration, cart CTA |
| `.btn-k-light` | bone `#f1f0ec` | black | Secondary / cancel / back |
| `.btn-lime` | lime `#c6ff94` | black | Action inside black panels |
| `.btn-k-ink` | black | white | Small emphatic action (demo autofill) |

All are pill-shaped, `inline-flex`, 600 weight, 200 ms spring, hover `-2px`, disabled grey
`#e7e7e7` with `cursor: not-allowed`. `.btn-sm` reduces padding. Destructive secondary actions
inside cards use Bootstrap `btn text-danger border-0` (dark red `#b91c1c`).

### 6.6 Pills, chips, badges

`.k-pill` — 0.7rem / 700, pill, variants green/amber/red/neutral as in §4.1.

`.k-chip` — white pill, hairline border, graphite text; hover bolt border; `.active` bolt fill with white text.
Used for catalog filters (`aria-pressed`), payment method switch, and in-card tab links.

`.k-cart-badge` — ember dot, white 2 px ring, top-right of the header cart.

### 6.7 Forms

| Class | Spec |
|-------|------|
| `.k-input`, `.k-select` | 1 px hairline, 12 px radius, white, `.68rem .95rem`, 0.95 rem |
| Focus | bolt border + 4 px bolt halo |
| `.k-label` | 0.82 rem / 600, smoke |
| Invalid | Bootstrap `is-invalid` + `invalid-feedback` |

Inputs are always `form-control k-input` / `form-select k-select` with a real `<label for>`.
Placeholders use Indonesian examples (`0812xxxxxxxx`, `Jakarta Selatan / Bandung`).

### 6.8 Cards

`.k-card` — 16 px radius, 1 px hairline, `springUp` on mount, hover lift `.k-card-hover`
(`-4px`, soft shadow, `.arrow-move` slides +4 px).

`.admin-card` — 18 px radius, 22 px padding, flex column, `margin-top:auto` footer with a
hairline separator. Tone classes `.tone-mist`, `.tone-ice`, `.tone-bloom`; bloom forces black
secondary copy. Used for courses, batches, instructors, teaching schedule.

`.batch-option` — 16 px radius; hover lift; `.is-selected` = 2 px black border + mist fill;
`.is-full` = 60% opacity. Contains `.batch-option-name`, `.batch-meta` (calendar/geo lines with ember icons).

`.schedule-row` — installment row: flex, paper, 14 px radius; main block + right column
(`.schedule-row-side`) with tabular amount and pay button. Stacks ≤ 575 px.

`.ops-row` — bone row, 14 px radius, for registrations; `.ops-code` (11 px tabular) above
`.ops-row-title`.

### 6.9 Summaries and receipts

`.summary-panel` — black sticky card, 24 px radius, paper headings, stone secondary,
`.summary-box` inset on `rgba(255,255,255,.06)`, `.summary-row` and `.summary-total` with the
amount in lime (1.6 rem / 700 / tabular).

`.receipt` — black checkout summary; `.receipt-tiers` lists discount tiers with the active tier
in lime; `.receipt-row` + `.receipt-divider` + `.receipt-total .amount` (1.7 rem lime).
Green pill inside the receipt is forced to ink-on-lime so the "Ke-N" queue number stays legible.

### 6.10 Empty states

`.empty-state` centres a 56 px lime icon tile, an `h2`/`h1`, a 420 px max paragraph, and a
wrapping action row. Used for guest gates, empty cart, no classes, unknown payment, empty
teaching schedule.

### 6.11 Header

```
sticky top; white 96% + blur(14px); 1 px hairline; z 1030
brand mark 36×36, 8 px radius, bolt, white “K”, rotate(-6deg) on hover
wordmark “karsa.” Inter 700, black, ember dot
nav track: bone pill container; links 0.88 rem/500; active = white pill
right cluster: sign-in / user menu / cart
```

| Role | Nav links |
|------|-----------|
| Guest | Katalog kelas · Kelas saya |
| Student | Katalog kelas · Kelas saya · Profil |
| Instructor | Jadwal mengajar saya |
| Admin | Ringkasan · Kelas · Jadwal kelas · Pengajar |

`.k-user-btn` — 40 px, bone, hairline, 28 px bolt avatar with initials, role pill (neutral /
amber for instructor / lime for admin), ember `pulse-dot` when a student profile is incomplete.

`.k-cart-btn` — 40 px circle; hover mist; active route = black with lime icon; ember badge.

### 6.12 Footer

White, hairline top, same 1200 px container. Brand lockup + role links + bottom bar
(`© 2026 Karsa Studio — Pendaftaran kelas tatap muka` / `Proyek Kelompok 3`).
Footer links are graphite, black and 600 on hover/active.

### 6.13 Auth modal and toast

`.k-modal-backdrop` — `rgba(0,0,0,.58)` + `blur(6px)`; `.k-modal-dialog` — white, hairline,
24 px radius, 440 px max width, `0 32px 64px -28px rgba(0,0,0,.45)`.

Login/register share a centred kicker (`Akun Karsa`), a title, and a primary bolt submit with a
switch link underneath. Error/notice use Bootstrap alerts.

Toast — fixed bottom-right, black card, lime title, stone body, hairline white border,
48 px total shadow depth.

---

## 7. Page-by-page

### 7.1 Catalog — `/courses`

1. **Hero** — location eyebrow, H1 with a Nanum script accent line, lede, two actions
   (bolt primary, ember outline).
2. **Trust band** (`.k-band`) — black, lime kicker, manifesto copy, 2×2 stats in navy/sage tiles.
3. **Catalog** — bone band, ember kicker, filter chip rail, 4/2/1 pastel course cards
   (mist, ice, bloom, white) with price, early-bird badge, and bolt CTA.
4. **Method comparison** — bone “learning alone” panel vs black “with Karsa” panel with lime checks.
5. **Closing CTA** — black band with remaining-seat count and bolt action.

### 7.2 Course detail — `/courses/:id`

- Back link, kicker + duration pill, large title, description.
- `.detail-layout`: left = batch list, instructor chips, syllabus; right = `.summary-panel`.
- Batch option shows name, seat pill (lime “Tersisa N dari 30 kursi” or red “Kelas penuh”),
  date range, time, location.
- Summary shows selected batch, seat state, queue number, price rows and lime total, then the
  CTA: “Masuk untuk mendaftar” (guest) or “Lanjut ke pembayaran” (lime); already-registered and
  full states are disabled.
- Syllabus rows are numbered 1…n; instructor chips use a black avatar with lime initials.

### 7.3 Checkout — `/checkout/:batchId`

- Page head + back link.
- `.checkout-layout`: left white panel with numbered steps 1 (class recap in a bone box) and
  2 (payment method chips + tenor select + schedule preview); right `.receipt`.
- Receipt = discount tier table, queue pill, price rows, lime total, pay CTA (lime) and
  “save to cart” (bone). Pay button is disabled until the profile is complete.

### 7.4 Cart — `/cart`

- Guest: centred panel with lime cart icon and login CTA.
- Signed in: page head with count and actions, `.cart-list` of white panels.
  Each panel: registration code + queue, course title, batch/date/location meta, amber
  “Menunggu pembayaran” pill, `.cost-box`, detail/cancel links, ember pay button.
- Empty: lime check icon, “Keranjang Anda kosong”, two actions.

### 7.5 My classes — `/my-courses` (+ tabs)

- Guest gate; otherwise page head (`Kelas saya (n)`) and a stacking list of
  `course-registration-card`s.
- Card: registration number, title, batch meta, registration + payment pills, method/total/paid/
  remaining line, tab chips, payment detail button, and the active tab body.
- Schedule tab: bone panel with date, time, location, instructor pills.
- Refund tab: four preset day buttons, tier preview, estimated refund, ember confirm.

### 7.6 Payment detail — `/payments/:registrationId`

- Back link, ember kicker, title, course/batch meta, status pills.
- `.checkout-layout`: left white summary panel with two `.cost-box`es (price breakdown, method/
  paid/remaining); right bone panel with either the upfront amount + ember pay button or the
  installment `.schedule-row` list (amount + lime “Lunas” or bolt pay button).
- Unknown registration: lime receipt empty state.

### 7.7 Profile — `/profile`

- Guest gate; otherwise ember kicker, title, lede.
- `.stat-grid--3`: mist “Kelas terdaftar”, black “Total sudah dibayar” (lime value), white
  “Sisa tagihan cicilan” (ember value).
- Activity panel with `.activity-row`s and payment links.
- Student profile form: panel head with completeness pill, lime “Lengkapi profil” bar with black
  autofill button, 8 fields, save (bolt) and explore (bone).

### 7.8 Teaching schedule — `/teaching-schedule`

- Page head with kicker, instructor name/email, schedule count pill.
- `.admin-grid` of pastel cards: batch pill, status + seats pill, course title, batch name,
  `.fact-grid` (dates, hours, location). Empty state when none.

### 7.9 Admin dashboard — `/admin/dashboard`

- Page head with three management links.
- 4-up `.stat-grid`: mist classes, ice batches, white registrations, black revenue (lime).
- Ops panel with one `.ops-row` per registration: code, student — course, batch/method/paid,
  status pills.

### 7.10 Admin courses / batches / instructors

- Shared pattern: page head + count pill + “+ Tambah …” toggle; optional bone form panel
  (Bootstrap grid) with primary save and light cancel; `.admin-grid` of pastel cards.
- Course card: category + hours, title, description, price, edit/delete.
- Batch card: ID + seats, status pill `n/30`, course + batch name, date/time/location facts,
  remaining seats + next queue, edit/delete.
- Instructor card: avatar + name/contacts, edit/delete, skill pills, bio, assignment rows with
  remove buttons. Top panel assigns an instructor to a batch (with accessible labels).

### 7.11 Auth modal

Triggered from header, gates and empty states. Login: email + password + submit + switch to
register. Register: name, email, password (min 8, hint), submit + switch to login.
Centred kicker, no illustration, 440 px.

---

## 8. Responsive behaviour

- Header collapses below `lg`; nav links become full-width rows; cart stays visible.
- Page heads stack at `≤ 767 px`; action groups wrap and full-width where they are the primary CTA.
- Course detail and checkout drop to one column at `≤ 1023 px`; summaries stop being sticky and
  follow the content.
- Admin/teaching grids become one column at `≤ 767 px`; stat tiles stay 2-up.
- Batch options stack text and pills; syllabus wraps with `overflow-wrap: anywhere`.
- Installment rows stack amount/action under the label at `≤ 575 px`.
- Touch targets are ≥ 40 px (header controls 40–44 px, buttons ≥ 40 px).
- No horizontal overflow at 390 px or 1440 px (verified on all routes).

---

## 9. Accessibility

- Colour pairs meet WCAG AA at their used sizes; ember on black is only used for large text or
  replaced with light red for body copy; secondary copy on black uses `--ui-stone`.
- Visible 3 px bolt focus ring everywhere; inputs add a 4 px halo.
- Landmarks: `header`, `main`, `footer`, one `h1` per page, labelled sections.
- Decorative icons are `aria-hidden`; icon-only buttons keep `aria-label` / `title`.
- Form controls use real labels; the instructor assignment selects use `for`/`id`; errors are
  linked with `aria-describedby` and `role="alert"`.
- Status is never colour-only: pills carry text, totals carry labels.
- Reduced motion is honoured globally.
- Auth modal: dialog role, backdrop click / close button, focus moved into the form, `Esc` closes.
- Automated axe (WCAG 2.1 A/AA) returns **0 violations** on all 13 routes at 1440 px and on the
  mobile variants tested, plus the open auth modal.

---

## 10. Implementation map

| Concern | File |
|---------|------|
| Tokens, primitives, page system, page-specific blocks | `src/styles.css` |
| Shell, nav, footer, modal, toast | `src/app/app.component.{html,css,ts}` |
| Landing hero, trust band, catalog grid, method | `src/app/pages/catalog-page/*` |
| Course detail + batch selection | `pages/course-detail-checkout/*` |
| Checkout + receipt | `pages/checkout-payment/*` |
| Cart | `pages/cart-page/*` |
| My classes, registration card, schedule/refund tabs | `pages/my-registrations/*` |
| Payment detail + installment rows | `pages/payment-detail/*` |
| Profile | `pages/profile-auth-page/*` |
| Teaching schedule | `pages/teaching-schedule/*` |
| Admin dashboard | `pages/admin-dashboard/*` |
| Admin classes / batches | `pages/admin-courses/*`, `pages/admin-batches/*` |
| Instructors + skill chips | `pages/instructors-page/*` |
| Fonts and preloads | `src/assets/fonts/*`, `src/index.html` |

---

## 11. Known issues & next steps

1. **Legacy aliases remain.** `--brand-*`, `--iris`, `--lavender`, `--mint`, `--bg-*` and
   `--text-*` still exist in `:root` for compatibility. No template or component CSS references
   them any more, so the whole alias block can be deleted in a follow-up cleanup.
2. **Duplicate legacy blocks.** `app.component.css` still carries old header/footer rules that were
   superseded during the redesign; consolidate before the next visual pass.
3. **`.font-mono` is not monospace** — it is Inter with tabular numbers. Rename to
   `.tnum` when touching the price components.
4. **Inline max-widths** on a few empty-state panels (560 px) could move to a
   `.panel--narrow` modifier.
5. **Seeded students are not linked to auth users** (`userId: -1`), so a demo login cannot show a
   populated cart/payment without temporarily linking a student. Seed a demo account or a
   mock-login shortcut.
6. **Modal accessibility hardening.** `Esc`, focus trap and `aria-modal` are specified; confirm
   they are enforced in code on every open path.
7. **Toast** is visual only; wrap it in `aria-live="polite"` and add auto-dismiss.
8. **Unrouted components.** `business-simulator-arch` and `student-dashboard` are compiled but
   unreachable; remove or route them.
9. **Demo affordances in production UI.** “Isi otomatis (demo)” and “Coba jadwal yang bentrok”
   should be hidden outside demo builds.
10. **Currency and dates** rely on `id-ID`; keep formatting in the service so new screens inherit it.
11. **Clamped course copy** cuts descriptions at three lines on the catalog; acceptable, but some
    cards end mid-sentence at narrow widths.
12. **Global `overflow-x: hidden` on body** can mask layout bugs; the QA pass should keep checking
    `scrollWidth - clientWidth` explicitly.

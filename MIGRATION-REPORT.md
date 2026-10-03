# Migration report — stamps-website

Plain HTML/CSS/JS site (`/home/claude/sources/stamps-current/`) → Astro + `@pcl/design-system`.
Build: `npm run build` ✓ · `npm run check:html` → **5 pages checked, 0 problem(s)**.

## Pages built

| Old file | Old URL | New URL | Source file |
|---|---|---|---|
| `index.html` | `/` | `/` | `src/pages/index.astro` |
| `tool.html` | `/tool` | `/tool/` | `src/pages/tool/index.astro` + `src/scripts/tool.js` + `src/data/items.js` |
| `progress.html` | `/progress` | `/progress/` | `src/pages/progress/index.astro` |
| `team.html` | `/team` | `/team/` | `src/pages/team/index.astro` |
| `feedback.html` | `/feedback` | `/feedback/` | `src/pages/feedback/index.astro` |

Also generated: `sitemap.xml`, `robots.txt` (now `Allow: /` — the old site was `noindex` / `Disallow: /`; switch back
in `public/robots.txt` and `page.noindex` if the site is still meant to be unlisted), `favicon.svg` (copied),
`apple-touch-icon.png` (drawn from the favicon), `og-image.png` (copied, 1200×630, 48 KB).

Shared shell: `src/components/SiteLayout.astro` wraps the design-system `Layout` with the status banner, the
ResearchProject schema, base-aware favicon links and the footer partner logos. Navigation: Home · Interactive Tool ·
Study Progress · Team · Give Feedback (same five items as before). Footer: McGill + LDI–JGH (design system) + **FRQS** and
**PMHA Alliance** logos via the `footer-logos` slot (`src/components/PartnerLogos.astro`, `public/logos/`, 42 KB + 40 KB);
the old footer's "Pages" and "Contact & Support" columns became `footerLinks` (five pages + the contact e-mail) and
the `footer-meta` line "Supported by the PMHA Alliance, FRQS, and the Lady Davis Institute." The McGill and LDI PNGs in
the source `logos/` folder were not copied (the design system supplies the official SVGs).

## Word counts (source page body between nav and footer vs. built `<main>`)

| Page | Source | Built | Notes |
|---|---|---|---|
| Home | 733 | 756 | All words present except the hero kicker "A Modified Delphi Expert-Consensus Initiative" (replaced by the eyebrow "McGill University · PMHA Alliance" per brief) and the two hero button labels ("Explore the Interactive Tool" → "Explore the tool", "See the Study Progress" → "Progress to date", per brief). Adds a visually-hidden h2 "The initiative in numbers" for the stats band. |
| Interactive tool | 126 | 151 | All static words present (controls, headings, notice). Adds the eyebrow "Interactive tool", a visually-hidden "Reset" label and "No verdict yet" screen-reader text on "—" chips. Item data: 409 items (the old README says 412; `data.js` actually holds 409 rows and the old tool also shows "409 of 409 items"). |
| Study progress | 1286 | 1309 | All words present; adds a visually-hidden h2 "Timeline". Source `<h4>` sub-headings under `<h2>` were promoted to `<h3>` (no skipped levels). |
| Team | 563 | 585 | All words present. Three stray `</p>` in the source bios (de la Salle, Irvine, Lehmann) split paragraphs mid-sentence; now clean two-paragraph bios. |
| Feedback | 103 | 194 | See "Feedback page" below: the form's labels and options are kept as a visible checklist; the Formspree form itself is gone. Missing tokens are only the `<select>` placeholder "Select one…" and the success message's "has been" → "is". |

Token-level check: every word token of each source page is present in the built page except those listed above.

## Feedback page — what it did and what it does now

`feedback.html` was a **home-made form** (`<form action="https://formspree.io/f/xjgqnowg" method="POST">` with a
fetch-based submit handler) collecting name, e-mail, role, topic and a free-text message through Formspree, a
third-party service. No institutional tool (Qualtrics/REDCap/Google Form) was referenced anywhere on the site; the
only institutional address in the source is `sara.delasalle@mail.mcgill.ca` (footer, team page, and the form's own
error fallback: "email us directly at sara.delasalle@mail.mcgill.ca"). Per the no-data-collection rule, the form was
replaced by a **mailto link** to that address with the subject the form used ("StaMPS Data Framework — Website Feedback")
and a body template listing the same five fields. All feedback links on the other pages point to `/feedback/` as before.
The address lives in one place: `contactEmail` in `src/site.config.ts` (the source README mentions
`kyle.greenway@mcgill.ca` as the feedback address, but every link in the actual pages used Sara de la Salle's — change
`contactEmail` if the PI's address is preferred).

## Interactive tool — port and verification

- Logic (`src/scripts/tool.js`) is the original script verbatim in substance: the data adapter, `matchesFilter`,
  `buildTree`/`nestByLevel`, `subtreeMatches`, `sortNodes`, expand/collapse overrides, "Expand all"/"Collapse all"/"Reset",
  category/timepoint colour palettes. Data moved from `data.js` to `src/data/items.js` (identical format + `export`);
  the regeneration workflow is documented in `README.md`.
- Markup now uses design-system classes: `.card` for the control panel, `fieldset`/`legend` for the verdict and timepoint
  groups, `.btn--secondary/--quiet .btn--small` for the tree/reset buttons, `.chip` (+ `.chip--group/--econ/--na`) for
  verdicts, `.table-wrap` + design-system table with `scope="col"` headers that are **sticky under the site header**
  on wide screens.
- Keyboard accessibility (new): sortable headers are `<button>`s inside `<th aria-sort>`, item toggles are
  `<button aria-expanded aria-label>` (focus is restored after re-render), subcategory headers are `<button aria-expanded>`
  (the whole row is still clickable), the result count is `role="status" aria-live="polite"`, the "—" verdict carries
  "No verdict yet" for screen readers. Verified with Playwright: Space on chips, Enter on sort/toggle buttons all work.
- No console errors from the page scripts. The only console message during preview is a 404 for `/favicon.svg`, which the
  design-system `Layout` emits as a root-relative link; under the `/stamps-website/` test base it 404s, at the custom
  domain root it resolves (a base-aware `<link rel="icon">` is also added in `SiteLayout`). Same for the header wordmark's
  `href="/"` — design-system `Header` prop `homeHref` is not base-aware.

### Old vs. new results (old site served with `python3 -m http.server 4632`, new with `astro preview --port 4631`)

| Filters applied | Old: count / rendered rows | New: count / rendered rows | Item lists identical |
|---|---|---|---|
| none | 409 of 409 / 409 | 409 of 409 / 409 | yes |
| For All Purposes | 127 of 409 / 130 | 127 of 409 / 130 | yes |
| For All Purposes + Baseline | 27 of 409 / 29 | 27 of 409 / 29 | yes |
| For Economic Purposes + Post-Treatment | 0 of 409 / 0 | 0 of 409 / 0 | yes |
| For Group Interventions + guideline GB-BCI | 8 of 409 / 11 | 8 of 409 / 11 | yes |
| Not Core + During Treatment + search "dose" | 2 of 409 / 2 | 2 of 409 / 2 | yes |
| For All Purposes + For Economic Purposes + guideline CHEERS | 17 of 409 / 21 | 17 of 409 / 21 | yes |
| search "safety" | 3 of 409 / 3 | 3 of 409 / 3 | yes |

("Rendered rows" > count when parent items are shown to reach a matching child — same behaviour on both sites.
Item lists compared by the full ordered list of visible item texts.)

## Design / quality rules

- One `<h1>` per page (`PageHeader`, or the hero on Home); heading order fixed where the source skipped h2 → h4.
- Every `<th>` has `scope` (`col`, `row`; the tool's generated category/subcategory rows use `scope="colgroup"`).
- No animations added; the only transitions are the design system's (inside `prefers-reduced-motion: no-preference`).
- Text left-aligned; colours: design-system tokens plus four measured status colours in `site.css`
  (group `#4F6244` 7.4:1, econ `#3C5A79` 7.5:1, pending `#7D6320` 5.6:1 on paper/white). Category header rows in the tool
  use the original HSL palette at lightness 36 % (was 39 %) so white text passes 4.5:1 on every category.
- Outbound links: `target="_blank" rel="noopener noreferrer"` (source had `rel="noopener"` only). FRQS logo now links to
  frq.gouv.qc.ca/sante (it was a plain image before).
- Hand-written title + description per page; schema.org **ResearchProject** (name, identifier, funders, members) on
  every page via `researchProjectSchema` in `site.config.ts`.
- No forms, no analytics. All internal hrefs go through `u()` / `import.meta.env.BASE_URL`.
- Images: all < 60 KB, no compression needed.

### Design-system note (not fixed here, worth fixing upstream)
`base.css` makes `thead th` sticky at `top: var(--header-h)`, but `.table-wrap` is `overflow-x: auto`, which makes the
wrapper the scroll container: the header never sticks to the page and, worse, is pushed ~72 px down inside the wrapper,
covering the first rows (visible on the first screenshots). `site.css` works around it with
`@media (min-width: 60em) { .table-wrap { overflow: visible } }` and `top: 0` on narrow screens.

## Screenshots (Playwright, Chromium)

`/tmp/claude-0/-home-claude/d9c59551-93c5-59f4-b4f5-a25a201bb1e9/scratchpad/stamps-shots/`
home-1400.png · home-390.png · tool-1400.png · tool-390.png · tool-filtered-1400.png · tool-filtered-390.png
(For All Purposes + Baseline + GCP) · progress-1400.png · progress-390.png · team-1400.png · team-390.png ·
feedback-1400.png · feedback-390.png · progress-print.png (print media).

Fixes made after looking: stats cards 3+1 → four in a row (`.stats-grid`); purpose cards 2+1 → three in a row;
Round 2 proposals table moved out of the 70ch reading column to full container width; footer partner logos sized to the
footer's 44 px row; sticky-header overlap on content tables (see note above).

## Not migrated / changed on purpose

- `vercel.json`, Vercel deployment instructions → GitHub Pages workflow from the template.
- Source `logos/mcgill.png`, `logos/ldi.png` → design-system SVGs.
- Formspree feedback form → mailto (above).
- Hero kicker and hero button labels (above, per brief).

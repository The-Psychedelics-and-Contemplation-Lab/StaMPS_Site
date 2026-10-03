# StaMPS Data Framework — website

Website of **Standardizing Measures and Practices in Psychedelic Science (StaMPS) Data Framework**, a modified Delphi expert-consensus study (protocol 25-05-146-01) led at McGill University in collaboration with the Psychedelic Mental Health Access Alliance.

Built with [Astro](https://astro.build) and the lab's shared [design-system](https://github.com/The-Psychedelics-and-Contemplation-Lab/design-system). Published automatically to GitHub Pages on every push to `main` (and nightly, to pick up design-system changes).

## Pages

| URL | File | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | Welcome: initiative, rationale, study design |
| `/tool/` | `src/pages/tool/index.astro` + `src/scripts/tool.js` | Interactive data framework tool (verdict / timepoint / guideline / search filters) |
| `/progress/` | `src/pages/progress/index.astro` | Round 1 & Round 2 results and next steps |
| `/team/` | `src/pages/team/index.astro` | Research team, PMHA Alliance collaboration, funding |
| `/feedback/` | `src/pages/feedback/index.astro` | Feedback by e-mail (no form — the site collects no data) |

`src/site.config.ts` holds the site name, accent colour, navigation, affiliation line, the contact e-mail
(`contactEmail`) and the schema.org ResearchProject block. `src/components/StatusBanner.astro` is the
"project in progress" line shown on every page — edit its default text there when a round completes.

## Updating the tool after Rounds 3–4

All item data live in **`src/data/items.js`** — the same auto-generated format as the former `data.js`,
with `export` in front of each constant so the tool script can import it. Regenerate the file from the master
sheet exactly as before, add `export` to `CATS`, `SUBS`, `GUIDES`, `TPS` and `D`, replace the file, commit.
Each row of `D` is:

`[categoryIndex, subcategoryIndex, "Item name", indentLevel, expertsSuggestingCore, verdict, guidelineBitmask, timepointIndex]`

- `verdict`: `0` = no verdict yet (under evaluation), `1` = Core (all purposes), `2` = Core for Economic purposes only, `3` = Core for group interventions only. New verdict types (e.g. Supplementary, Equity module) are added in `VERDICT_NAMES` and `verdictClass()` in `src/scripts/tool.js`, with a matching `.chip--…` colour in `src/styles/site.css`.
- `guidelineBitmask`: bit *i* set means the item maps to `GUIDES[i]`.
- `timepointIndex`: index into `TPS` (`-1` = general/unspecified).

The filtering, tree and sorting logic in `src/scripts/tool.js` is the original tool's, unchanged.

## Working locally
```
npm install
npm run dev        # http://localhost:4321/stamps-website/
npm run build && npm run check:html
```

While the site is tested on github.io it lives under `/stamps-website/`; once the custom domain
(`stamps.psychedelicsandcontemplationlab.com`) is switched on, set `PUBLIC_SITE_BASE=""` and
`PUBLIC_SITE_URL` in the deploy workflow.

## Feedback

Feedback links throughout the site open a pre-addressed e-mail to `contactEmail` (set in `src/site.config.ts`).

## Hosting note

Until launch, this Astro site lives on the `astro` branch and is previewed on GitHub Pages
(https://the-psychedelics-and-contemplation-lab.github.io/stamps-website/). `main` still holds the
legacy static site deployed by Vercel (https://stamps-website.vercel.app). At launch: merge `astro`
into `main`, set `PUBLIC_SITE_BASE=''`/`PUBLIC_SITE_URL` in the workflow, set the custom domain on
GitHub Pages, and turn the Vercel project into a redirect.

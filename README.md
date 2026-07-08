# StaMPS Data Framework — Website

Static website for **Standardizing Measures and Practices in Psychedelic Science (StaMPS) Data Framework**, a modified Delphi expert-consensus study (protocol 25-05-146-01) led at McGill University in collaboration with the Psychedelic Mental Health Access Alliance.

## Contents

| File | Purpose |
|---|---|
| `index.html` | Welcome page: initiative, rationale, and study design |
| `tool.html` | Interactive data framework tool (purpose + specifier driven) |
| `progress.html` | Summary of Round 1 & Round 2 results and next steps |
| `team.html` | Research team and PMHA Alliance collaboration |
| `data.js` | Item library (412 items, post-Round 2 verdicts) — regenerate as consensus advances |
| `style.css` | Shared stylesheet |
| `vercel.json` | Vercel config (clean URLs) |

No build step, frameworks, or dependencies — plain HTML/CSS/JS.

## Deploying to Vercel

**Option A — drag and drop (easiest):**
1. Go to [vercel.com/new](https://vercel.com/new) and sign in.
2. Drag this `stamps-website` folder onto the page.
3. Deploy. Done — you'll get a URL like `stamps-framework.vercel.app` (renameable in Project Settings → Domains).

**Option B — command line:**
```
cd stamps-website
npx vercel --prod
```

**Option C — Git integration (best for ongoing updates):** push this folder to a GitHub repository and import it at vercel.com/new; every push then redeploys automatically.

## Updating the tool after Rounds 3–4

All item data live in `data.js`. Each row is:
`[categoryIndex, subcategoryIndex, "Item name", indentLevel, expertsSuggestingCore, verdict, guidelineBitmask, timepointIndex]`

- `verdict`: `0` = no verdict yet (under evaluation), `1` = Core (all purposes), `2` = Core for Economic purposes only, `3` = Core for group interventions only. New verdict types (e.g., Supplementary, Equity module) can be added in `VERDICT_NAMES` and `verdictClass()` in `tool.html`.
- `guidelineBitmask`: bit *i* set means the item maps to `GUIDES[i]`.
- `timepointIndex`: index into `TPS` (`-1` = general/unspecified).

## Feedback

Feedback links throughout the site open a pre-addressed email to `kyle.greenway@mcgill.ca`.

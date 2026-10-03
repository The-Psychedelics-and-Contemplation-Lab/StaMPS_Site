// Post-build checks shared by the four sites: exactly one <h1> per page,
// heading levels never skip, every internal link and anchor resolves,
// every <img> has alt, every table header has scope.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const root = resolve('dist');
const cfg = existsSync('src/site.config.ts') ? readFileSync('src/site.config.ts', 'utf8') : '';
const base = (process.env.PUBLIC_SITE_BASE ?? (cfg.match(/base:\s*'([^']*)'/)?.[1] ?? '')).replace(/\/$/, '');
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') && pages.push(p); } })(root);
let errors = 0;
const err = (p, m) => { errors++; console.error(`✗ ${p.replace(root, '')}: ${m}`); };
const ids = new Map();
for (const p of pages) ids.set(p, new Set([...readFileSync(p, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(p, `${h1} <h1> elements`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map(m => +m[1]);
  for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) err(p, `heading jumps h${levels[i - 1]} → h${levels[i]}`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(m[0])) err(p, `img without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<th\b[^>]*>/g)) if (!/\sscope=/.test(m[0])) err(p, `th without scope`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) err(p, 'missing meta description');
  if (!/property="og:description"/.test(html)) err(p, 'missing og:description');
  if (!/name="twitter:card" content="summary_large_image"/.test(html)) err(p, 'twitter:card is not summary_large_image');
  if (!/application\/ld\+json/.test(html)) err(p, 'missing schema.org JSON-LD');
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
    const tag = m[0], href = m[1];
    if (/^https?:\/\//.test(href) && !href.startsWith(process.env.SITE_URL || '\u0000')) {
      if (!/target="_blank"/.test(tag) || !/rel="[^"]*noopener[^"]*noreferrer/.test(tag)) err(p, `outbound link without target=_blank rel=noopener noreferrer: ${href}`);
      continue;
    }
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    let [path, hash] = href.split('#');
    let target;
    if (path === '') target = p;
    else {
      if (base && path.startsWith(base + '/')) path = path.slice(base.length);
      const abs = path.startsWith('/') ? join(root, path) : join(dirname(p), path);
      target = abs.endsWith('.html') ? abs : existsSync(join(abs, 'index.html')) ? join(abs, 'index.html') : abs;
      if (!existsSync(target)) { err(p, `broken internal link: ${href}`); continue; }
    }
    if (hash && ids.has(target) && !ids.get(target).has(hash)) err(p, `broken anchor: ${href}`);
  }
}
console.log(`${pages.length} pages checked, ${errors} problem(s)`);
process.exit(errors ? 1 : 0);

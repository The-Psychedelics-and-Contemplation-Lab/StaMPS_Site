// StaMPS interactive tool — ported from the original tool.html script.
// Filtering, tree-building, sorting and expand/collapse logic are unchanged;
// the DOM uses real <button>s (sortable headers, toggles) so everything works
// from the keyboard, and the result count is announced via aria-live.
import { CATS, SUBS, GUIDES, TPS, D } from '../data/items.js';

const $ = (id) => document.getElementById(id);

// Adapter: expand the compact data rows into the object format used by the
// original COSMIP preliminary tool script.
const VERDICT_NAMES = [null, 'CORE', 'Economic only', 'Group only'];
const DATA = D.map((r) => ({
  category: CATS[r[0]],
  subcategory: SUBS[r[1]],
  item: r[2],
  level: r[3],
  numExperts: r[4],
  verdict: VERDICT_NAMES[r[5]],
  guidelines: GUIDES.filter((g, i) => r[6] & (1 << i)),
  timepoint: r[7] >= 0 ? TPS[r[7]] : null,
}));
DATA.forEach((r, i) => { r.id = i; });

const allGuidelines = Array.from(new Set(DATA.flatMap((r) => r.guidelines))).sort();
const guidelineSelect = $('sel-guideline');
allGuidelines.forEach((g) => {
  const opt = document.createElement('option');
  opt.value = g;
  opt.textContent = g;
  guidelineSelect.appendChild(opt);
});

// -- timepoint checkboxes -----------------------------------------------
const TIMEPOINT_PALETTE = [
  { h: 200, s: 45 },
  { h: 150, s: 30 },
  { h: 42, s: 55 },
  { h: 15, s: 50 },
  { h: 280, s: 25 },
];
const allTimepoints = Array.from(new Set(DATA.map((r) => r.timepoint).filter(Boolean)));
const timepointColorMap = new Map();
allTimepoints.forEach((tp, i) => timepointColorMap.set(tp, TIMEPOINT_PALETTE[i % TIMEPOINT_PALETTE.length]));

const timepointRow = $('timepoint-row');
allTimepoints.forEach((tp, i) => {
  const label = document.createElement('label');
  label.className = 'filter-chip timepoint-item';
  label.id = `lbl-tp-${i}`;
  label.setAttribute('data-timepoint', tp);
  label.innerHTML = `<input type="checkbox" id="chk-tp-${i}"> ${escapeHtml(tp)}`;
  timepointRow.appendChild(label);
});

// -- category color palette --------------------------------------------
const PALETTE = [
  { h: 16, s: 55 }, // clay / terracotta
  { h: 88, s: 26 }, // moss
  { h: 206, s: 38 }, // steel blue
  { h: 42, s: 58 }, // ochre / gold
  { h: 266, s: 20 }, // muted plum
  { h: 174, s: 28 }, // teal
  { h: 340, s: 32 }, // dusty rose
  { h: 28, s: 18 }, // warm taupe
];
function hsl(h, s, l) { return `hsl(${h}, ${s}%, ${l}%)`; }

const categoryHueMap = new Map();
(function assignCategoryColors() {
  const seen = [];
  DATA.forEach((r) => { if (!seen.includes(r.category)) seen.push(r.category); });
  seen.forEach((cat, i) => categoryHueMap.set(cat, PALETTE[i % PALETTE.length]));
})();

function catColors(cat) {
  const p = categoryHueMap.get(cat) || { h: 0, s: 0 };
  return {
    header: hsl(p.h, p.s, 36),
    sub: hsl(p.h, Math.max(p.s - 10, 8), 89),
    subText: hsl(p.h, p.s, 25),
    tint0: hsl(p.h, Math.max(p.s - 22, 5), 96.5),
    tint1: hsl(p.h, Math.max(p.s - 24, 5), 97.5),
    tint2: hsl(p.h, Math.max(p.s - 26, 5), 98.5),
  };
}
// ------------------------------------------------------------------------

let sortKey = null;
let sortDir = 1;
const nodeOverride = new Map(); // id -> explicit expanded (true/false) set by user clicks
const subcategoryOverride = new Map(); // "category::subcategory" -> explicit expanded (true/false)
function subKeyOf(category, subcategory) { return `${category}::${subcategory}`; }

function currentFilters() {
  const timepoints = allTimepoints.filter((tp, i) => $(`chk-tp-${i}`).checked);
  return {
    core: $('chk-core').checked,
    group: $('chk-group').checked,
    econ: $('chk-econ').checked,
    notcore: $('chk-notcore').checked,
    timepoints,
    guideline: guidelineSelect.value,
    search: $('search-box').value.trim().toLowerCase(),
  };
}

function verdictClass(v) {
  if (v === 'CORE') return 'chip--core';
  if (v === 'Group only') return 'chip--group';
  if (v === 'Economic only') return 'chip--econ';
  return 'chip--na';
}

function matchesFilter(r, f, anyVerdictSelected) {
  if (anyVerdictSelected) {
    const matches =
      (f.core && r.verdict === 'CORE') ||
      (f.group && r.verdict === 'Group only') ||
      (f.econ && r.verdict === 'Economic only') ||
      (f.notcore && !r.verdict);
    if (!matches) return false;
  }
  if (f.timepoints && f.timepoints.length > 0 && !f.timepoints.includes(r.timepoint)) return false;
  if (f.guideline && !r.guidelines.includes(f.guideline)) return false;
  if (f.search && !r.item.toLowerCase().includes(f.search)) return false;
  return true;
}

function buildTree(rows) {
  const categoryOrder = [];
  const catMap = new Map();
  rows.forEach((r) => {
    if (!catMap.has(r.category)) { catMap.set(r.category, { subOrder: [], subMap: new Map() }); categoryOrder.push(r.category); }
    const cat = catMap.get(r.category);
    if (!cat.subMap.has(r.subcategory)) { cat.subMap.set(r.subcategory, []); cat.subOrder.push(r.subcategory); }
    cat.subMap.get(r.subcategory).push(r);
  });

  function nestByLevel(list) {
    const roots = [];
    const stack = [];
    list.forEach((r) => {
      const node = { row: r, children: [] };
      while (stack.length > r.level) stack.pop();
      if (stack.length === 0) roots.push(node);
      else stack[stack.length - 1].children.push(node);
      stack.push(node);
    });
    return roots;
  }

  return categoryOrder.map((cat) => {
    const c = catMap.get(cat);
    const subs = c.subOrder.map((sub) => ({ subcategory: sub, roots: nestByLevel(c.subMap.get(sub)) }));
    return { category: cat, subs };
  });
}

function subtreeMatches(node, f, anyVerdictSelected) {
  if (matchesFilter(node.row, f, anyVerdictSelected)) return true;
  return node.children.some((ch) => subtreeMatches(ch, f, anyVerdictSelected));
}

function sortNodes(nodes) {
  if (!sortKey) return nodes;
  return nodes.slice().sort((a, b) => {
    const ra = a.row, rb = b.row;
    let av = ra[sortKey], bv = rb[sortKey];
    if (sortKey === 'guidelines') { av = ra.guidelines.join(', '); bv = rb.guidelines.join(', '); }
    av = (av || '').toString().toLowerCase();
    bv = (bv || '').toString().toLowerCase();
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return 0;
  });
}

function renderNode(node, frag, f, anyFilterActive, anyVerdictSelected, colors) {
  const visible = anyFilterActive ? subtreeMatches(node, f, anyVerdictSelected) : true;
  if (!visible) return false;

  const r = node.row;
  const hasChildren = node.children.length > 0;

  // Expand/collapse state: once a user has explicitly clicked a node's
  // toggle, that choice always wins (nodeOverride). Otherwise: fully open
  // with no filter, or auto-opened just far enough to surface a matching
  // descendant when a filter is active.
  let expanded;
  if (nodeOverride.has(r.id)) expanded = nodeOverride.get(r.id);
  else if (!anyFilterActive) expanded = true;
  else expanded = node.children.some((ch) => subtreeMatches(ch, f, anyVerdictSelected));
  expanded = hasChildren && expanded;

  const tr = document.createElement('tr');
  tr.setAttribute('data-level', String(r.level));
  tr.setAttribute('data-id', String(r.id));
  const vClass = verdictClass(r.verdict);
  const vLabel = r.verdict ? r.verdict : '—';
  const vSr = r.verdict ? '' : '<span class="visually-hidden">No verdict yet</span>';
  const indent = 8 + r.level * 24;
  const tint = r.level <= 0 ? colors.tint0 : (r.level === 1 ? colors.tint1 : colors.tint2);
  const toggleHtml = hasChildren
    ? `<button type="button" class="toggle-btn" data-toggle-id="${r.id}" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} sub-items of ${escapeHtml(r.item)}">${expanded ? '▾' : '▸'}</button>`
    : '<span class="toggle-spacer"></span>';

  tr.innerHTML = `
    <td class="item" style="background:${tint};">
      <div class="item-cell" style="padding-left:${indent}px;">
        ${toggleHtml}
        <span class="item-text">${escapeHtml(r.item)}</span>
      </div>
    </td>
    <td class="verdict" style="background:${tint};"><span class="chip ${vClass}">${escapeHtml(vLabel)}${vSr}</span></td>
    <td class="guidelines" style="background:${tint};">${escapeHtml(r.guidelines.join(', '))}</td>
  `;
  frag.appendChild(tr);

  if (expanded) {
    sortNodes(node.children).forEach((child) => renderNode(child, frag, f, anyFilterActive, anyVerdictSelected, colors));
  }
  return true;
}

function render() {
  const f = currentFilters();
  const anyVerdictSelected = f.core || f.group || f.econ || f.notcore;
  const anyFilterActive = anyVerdictSelected || f.timepoints.length > 0 || !!f.guideline || !!f.search;

  const tree = buildTree(DATA);

  const tbody = $('table-body');
  tbody.innerHTML = '';

  const frag = document.createDocumentFragment();
  let anyRendered = false;

  tree.forEach((catGroup) => {
    const catVisible = !anyFilterActive || catGroup.subs.some((sub) =>
      sub.roots.some((node) => subtreeMatches(node, f, anyVerdictSelected)));
    if (!catVisible) return;

    const colors = catColors(catGroup.category);

    const catTr = document.createElement('tr');
    catTr.className = 'category-header';
    catTr.innerHTML = `<th scope="colgroup" colspan="3" style="background:${colors.header};color:#fff;">${escapeHtml(catGroup.category)}</th>`;
    frag.appendChild(catTr);

    catGroup.subs.forEach((sub) => {
      const subVisible = !anyFilterActive || sub.roots.some((node) => subtreeMatches(node, f, anyVerdictSelected));
      if (!subVisible) return;

      const subKey = subKeyOf(catGroup.category, sub.subcategory);
      const subExpanded = subcategoryOverride.has(subKey) ? subcategoryOverride.get(subKey) : true;

      const subTr = document.createElement('tr');
      subTr.className = 'subcategory-header';
      subTr.setAttribute('data-subkey', subKey);
      subTr.innerHTML = `<th scope="colgroup" colspan="3" style="background:${colors.sub};color:${colors.subText};">
        <button type="button" class="subcat-toggle" data-subkey="${escapeHtml(subKey)}" aria-expanded="${subExpanded}">
          <span class="subcat-arrow" aria-hidden="true">${subExpanded ? '▾' : '▸'}</span>
          <span class="subcat-label">${escapeHtml(sub.subcategory)}</span>
        </button>
      </th>`;
      frag.appendChild(subTr);

      if (subExpanded) {
        sortNodes(sub.roots).forEach((node) => {
          const rendered = renderNode(node, frag, f, anyFilterActive, anyVerdictSelected, colors);
          anyRendered = anyRendered || rendered;
        });
      } else {
        anyRendered = true;
      }
    });
  });

  tbody.appendChild(frag);
  $('empty-state').hidden = anyRendered;

  const matchCount = anyFilterActive
    ? DATA.filter((r) => matchesFilter(r, f, anyVerdictSelected)).length
    : DATA.length;
  $('result-count').textContent = `${matchCount} of ${DATA.length} items`;

  const parts = [];
  if (f.core) parts.push('For All Purposes');
  if (f.econ) parts.push('For Economic Purposes');
  if (f.group) parts.push('For Group Interventions');
  if (f.notcore) parts.push('Not Core');
  let summary = parts.length ? `Verdict: ${parts.join(' + ')}` : '';
  if (f.timepoints.length) summary += (summary ? ' · ' : '') + `Timepoint: ${f.timepoints.join(' + ')}`;
  if (f.guideline) summary += (summary ? ' · ' : '') + `Guideline: ${f.guideline}`;
  if (f.search) summary += (summary ? ' · ' : '') + `Search: "${f.search}"`;
  $('filter-summary').textContent = summary;

  $('lbl-core').classList.toggle('active', f.core);
  $('lbl-group').classList.toggle('active', f.group);
  $('lbl-econ').classList.toggle('active', f.econ);
  $('lbl-notcore').classList.toggle('active', f.notcore);
  allTimepoints.forEach((tp, i) => {
    const lbl = $(`lbl-tp-${i}`);
    const isActive = f.timepoints.includes(tp);
    lbl.classList.toggle('active', isActive);
    const c = timepointColorMap.get(tp);
    if (isActive) {
      lbl.style.borderColor = hsl(c.h, c.s, 40);
      lbl.style.background = hsl(c.h, Math.max(c.s - 15, 8), 92);
    } else {
      lbl.style.borderColor = '';
      lbl.style.background = '';
    }
  });
}

// One delegated listener on the table body handles item toggles and
// subcategory headers (the whole header row is clickable, as before).
$('table-body').addEventListener('click', (e) => {
  const toggle = e.target.closest('.toggle-btn');
  if (toggle) {
    e.stopPropagation();
    const id = parseInt(toggle.getAttribute('data-toggle-id'), 10);
    const currentlyExpanded = toggle.getAttribute('aria-expanded') === 'true';
    nodeOverride.set(id, !currentlyExpanded);
    render();
    const again = $('table-body').querySelector(`.toggle-btn[data-toggle-id="${id}"]`);
    if (again) again.focus();
    return;
  }
  const row = e.target.closest('tr.subcategory-header');
  if (row) {
    const btn = row.querySelector('.subcat-toggle');
    if (!btn) return;
    const subKey = btn.getAttribute('data-subkey');
    const currentlyExpanded = btn.getAttribute('aria-expanded') === 'true';
    subcategoryOverride.set(subKey, !currentlyExpanded);
    render();
    const again = $('table-body').querySelector(`.subcat-toggle[data-subkey="${CSS.escape(subKey)}"]`);
    if (again && e.target.closest('.subcat-toggle')) again.focus();
  }
});

function escapeHtml(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

['chk-core', 'chk-group', 'chk-econ', 'chk-notcore'].forEach((id) => {
  $(id).addEventListener('change', render);
});
allTimepoints.forEach((tp, i) => {
  $(`chk-tp-${i}`).addEventListener('change', render);
});
guidelineSelect.addEventListener('change', render);
$('search-box').addEventListener('input', render);
$('reset-btn').addEventListener('click', () => {
  $('chk-core').checked = false;
  $('chk-group').checked = false;
  $('chk-econ').checked = false;
  $('chk-notcore').checked = false;
  allTimepoints.forEach((tp, i) => { $(`chk-tp-${i}`).checked = false; });
  guidelineSelect.value = '';
  $('search-box').value = '';
  sortKey = null; sortDir = 1;
  nodeOverride.clear();
  subcategoryOverride.clear();
  updateSortIndicators();
  render();
});
$('expand-all-btn').addEventListener('click', () => {
  DATA.forEach((r) => nodeOverride.set(r.id, true));
  subcategoryOverride.clear();
  render();
});
$('collapse-all-btn').addEventListener('click', () => {
  nodeOverride.clear();
  subcategoryOverride.clear();
  DATA.forEach((r) => { if (r.level === 0) nodeOverride.set(r.id, false); });
  render();
});

function updateSortIndicators() {
  document.querySelectorAll('thead th[data-key]').forEach((th) => {
    const active = th.dataset.key === sortKey;
    th.setAttribute('aria-sort', active ? (sortDir === 1 ? 'ascending' : 'descending') : 'none');
    th.querySelector('.arrow').textContent = active ? (sortDir === 1 ? '▲' : '▼') : '';
  });
}
document.querySelectorAll('thead th[data-key] .sort-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.closest('th').dataset.key;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    updateSortIndicators();
    render();
  });
});

render();

import type { Rank } from './types';

/**
 * Flat, original SVG drawings of rank insignia, built from simple shapes (chevrons,
 * rockers, bars, oak leaves, eagles, stars). They show the pattern of each insignia,
 * not an exact reproduction of the official artwork, and are labelled as simplified.
 *
 * Returns SVG markup for a 100×100 view box, or null for grades with no insignia.
 */

const GOLD = { fill: '#d6ab3a', edge: '#8a6a17' };
const SILVER = { fill: '#cfd4dc', edge: '#7c838e' };
const RED = { fill: '#b8312f', edge: '#6e1715' };
const NAVY_BLUE = '#1f3561';

type Metal = { fill: string; edge: string };
const svg = (body: string, label: string) =>
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label.replace(/"/g, '')}"><title>${label.replace(/[<&]/g, '')}</title>${body}</svg>`;

// ─── Primitives ──────────────────────────────────────────────────────────────────
/** An upward chevron whose apex sits at (50, y). */
const chevron = (y: number, m: Metal, w = 74, h = 15, t = 7) => {
  const l = 50 - w / 2;
  const r = 50 + w / 2;
  return `<polygon points="${l},${y + h} 50,${y} ${r},${y + h} ${r},${y + h + t} 50,${y + t} ${l},${y + h + t}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.2" stroke-linejoin="round"/>`;
};
/** A downward chevron (Navy and Coast Guard petty officers), top edge at y. */
const chevronDown = (y: number, m: Metal, w = 66, h = 14, t = 6.5) => {
  const l = 50 - w / 2;
  const r = 50 + w / 2;
  return `<polygon points="${l},${y} 50,${y + h} ${r},${y} ${r},${y + t} 50,${y + h + t} ${l},${y + t}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.2" stroke-linejoin="round"/>`;
};
/** A rocker: an arc that dips below, centred at x 50. */
const rocker = (y: number, m: Metal, w = 74, d = 13, t = 7) => {
  const l = 50 - w / 2;
  const r = 50 + w / 2;
  return `<path d="M${l},${y} Q50,${y + d * 2} ${r},${y} L${r},${y + t} Q50,${y + d * 2 + t} ${l},${y + t} Z" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.2" stroke-linejoin="round"/>`;
};
const star = (cx: number, cy: number, r: number, m: Metal) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1" stroke-linejoin="round"/>`;
};
const stars = (n: number, cy: number, r: number, m: Metal) => {
  const gap = r * 2.15;
  const start = 50 - ((n - 1) * gap) / 2;
  return Array.from({ length: n }, (_, i) => star(start + i * gap, cy, r, m)).join('');
};
const diamond = (cx: number, cy: number, s: number, m: Metal) =>
  `<polygon points="${cx},${cy - s} ${cx + s * 0.7},${cy} ${cx},${cy + s} ${cx - s * 0.7},${cy}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1"/>`;
/** Two crossed rifles, used by Marine NCOs. */
const rifles = (cy: number, m: Metal, len = 30) =>
  `<g stroke="${m.edge}" stroke-width="1" fill="${m.fill}"><rect x="47.8" y="${cy - len / 2}" width="4.4" height="${len}" rx="1.4" transform="rotate(38 50 ${cy})"/><rect x="47.8" y="${cy - len / 2}" width="4.4" height="${len}" rx="1.4" transform="rotate(-38 50 ${cy})"/></g>`;
/** A bursting bomb: a ball with a flame, for Master Gunnery Sergeant. */
const bomb = (cy: number, m: Metal) =>
  `<circle cx="50" cy="${cy + 3}" r="6.5" fill="${m.fill}" stroke="${m.edge}" stroke-width="1"/><path d="M46,${cy - 3} Q50,${cy - 14} 54,${cy - 3} Q50,${cy - 7} 46,${cy - 3}Z" fill="${m.fill}" stroke="${m.edge}" stroke-width="1"/>`;
/** A spread eagle silhouette. */
const eagle = (cx: number, cy: number, s: number, m: Metal) => {
  const k = s / 40;
  const p = (x: number, y: number) => `${(cx + x * k).toFixed(1)},${(cy + y * k).toFixed(1)}`;
  const wings = `M${p(0, -4)} L${p(-36, -16)} L${p(-30, -6)} L${p(-38, -2)} L${p(-26, 4)} L${p(-30, 10)} L${p(-8, 8)} L${p(-6, 20)} L${p(0, 16)} L${p(6, 20)} L${p(8, 8)} L${p(30, 10)} L${p(26, 4)} L${p(38, -2)} L${p(30, -6)} L${p(36, -16)} Z`;
  return `<path d="${wings}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${cx}" cy="${(cy - 9 * k).toFixed(1)}" r="${(5 * k).toFixed(1)}" fill="${m.fill}" stroke="${m.edge}" stroke-width="1"/>`;
};
const bar = (x: number, w: number, m: Metal, h = 18) =>
  `<rect x="${x}" y="${50 - h / 2}" width="${w}" height="${h}" rx="2.5" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.4"/>`;
const oakLeaf = (m: Metal) =>
  `<path d="M50,12 C61,22 70,22 66,34 C76,36 78,46 68,50 C78,56 74,66 64,64 C66,74 58,80 52,76 L52,90 L48,90 L48,76 C42,80 34,74 36,64 C26,66 22,56 32,50 C22,46 24,36 34,34 C30,22 39,22 50,12 Z" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.4" stroke-linejoin="round"/><path d="M50,22 L50,76 M50,40 L60,34 M50,40 L40,34 M50,54 L62,50 M50,54 L38,50" stroke="${m.edge}" stroke-width="1.2" fill="none"/>`;
/** Warrant officer bar with blocks (Army/Marine squares, Navy/CG breaks) or a lengthwise line. */
const warrantBar = (metal: Metal, block: string, count: number, line = false) => {
  let body = bar(18, 64, metal, 20);
  if (line) body += `<rect x="22" y="47" width="56" height="6" fill="${block}"/>`;
  else {
    const w = 7;
    const gap = 5;
    const start = 50 - (count * w + (count - 1) * gap) / 2;
    for (let i = 0; i < count; i += 1) body += `<rect x="${start + i * (w + gap)}" y="42" width="${w}" height="16" fill="${block}"/>`;
  }
  return body;
};
/**
 * Air Force and Space Force style stripes: a star (or delta) disc at the top with up to
 * five stripes under it, apex up; senior NCOs add one to three stripes above, apex down.
 */
const airmanStripes = (total: number, m: Metal, accent: string, delta = false) => {
  const below = Math.min(total, 5);
  const above = Math.max(0, total - 5);
  const centre = above ? 46 : 26;
  let body = '';
  for (let i = 0; i < below; i += 1) body += chevron(centre + 12 + i * 9, m, 80, 12, 5.5);
  for (let i = 0; i < above; i += 1) {
    const y = centre - 20 - i * 9;
    body += `<g transform="rotate(180 50 ${y + 9})">${chevron(y, m, 80, 12, 5.5)}</g>`;
  }
  body += `<circle cx="50" cy="${centre}" r="11" fill="${accent}" stroke="${m.edge}" stroke-width="1.2"/>`;
  body += delta
    ? `<polygon points="50,${centre - 7} 57,${centre + 6} 50,${centre + 2} 43,${centre + 6}" fill="${m.fill}"/>`
    : star(50, centre + 0.5, 7.5, m);
  return body;
};

// ─── By branch ───────────────────────────────────────────────────────────────────
function officer(r: Rank): string | null {
  const g = r.grade;
  if (g === 'O-1') return bar(41, 18, GOLD, 52);
  if (g === 'O-2') return bar(41, 18, SILVER, 52);
  // Captain: two parallel bars joined top and bottom.
  if (g === 'O-3') return `<path d="M27,24 H73 V76 H27 Z M45,30 V70 H55 V30 Z" fill-rule="evenodd" fill="${SILVER.fill}" stroke="${SILVER.edge}" stroke-width="1.4" stroke-linejoin="round"/>`;
  if (g === 'O-4') return oakLeaf(GOLD);
  if (g === 'O-5') return oakLeaf(SILVER);
  if (g === 'O-6') return eagle(50, 52, 40, SILVER);
  const n = { 'O-7': 1, 'O-8': 2, 'O-9': 3, 'O-10': 4 }[g];
  if (n) return stars(n, 50, n === 4 ? 10.5 : 13, SILVER);
  if (g === 'O-11') {
    let body = '';
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      body += star(50 + 26 * Math.cos(a), 52 + 26 * Math.sin(a), 11, SILVER);
    }
    return body;
  }
  return null;
}

function warrant(r: Rank): string | null {
  const n = Number(r.grade.split('-')[1]);
  switch (r.branch) {
    case 'army':
      return n === 5 ? warrantBar(SILVER, '#1b1b1b', 0, true) : warrantBar(SILVER, '#1b1b1b', n);
    case 'marine-corps':
      if (n === 5) return warrantBar(SILVER, RED.fill, 0, true);
      return n <= 2 ? warrantBar(GOLD, RED.fill, n) : warrantBar(SILVER, RED.fill, n - 2);
    case 'navy':
    case 'coast-guard':
      if (n === 5) return warrantBar(SILVER, NAVY_BLUE, 0, true);
      if (n === 1) return warrantBar(GOLD, NAVY_BLUE, 1);
      return n === 2 ? warrantBar(GOLD, NAVY_BLUE, 2) : warrantBar(SILVER, NAVY_BLUE, n - 1);
    case 'air-force':
      return n === 5 ? warrantBar(SILVER, '#2b4f8f', 0, true) : warrantBar(SILVER, '#2b4f8f', n);
    default:
      return null;
  }
}

function army(r: Rank): string | null {
  const a = r.abbr;
  const m = GOLD;
  const stack = (c: number, k: number) => {
    let body = '';
    const top = c === 1 ? 22 : 10;
    for (let i = 0; i < c; i += 1) body += chevron(top + i * 11, m, 74, 14, 6.5);
    // Rockers sit clear of the lowest chevron, so the two never read as one shape.
    for (let i = 0; i < k; i += 1) body += rocker(top + (c - 1) * 11 + 26 + i * 9, m, 74, 11, 6.5);
    return body;
  };
  switch (a) {
    case 'PVT': return null;
    case 'PV2': return stack(1, 0);
    case 'PFC': return stack(1, 1);
    case 'SPC': return `<path d="M24,22 L76,22 L76,52 Q76,78 50,88 Q24,78 24,52 Z" fill="${m.fill}" stroke="${m.edge}" stroke-width="1.4"/>${eagle(50, 56, 26, { fill: '#2b2b25', edge: '#2b2b25' })}`;
    case 'CPL': return stack(2, 0);
    case 'SGT': return stack(3, 0);
    case 'SSG': return stack(3, 1);
    case 'SFC': return stack(3, 2);
    case 'MSG': return stack(3, 3);
    case '1SG': return stack(3, 3) + diamond(50, 44, 6.5, m);
    case 'SGM': return stack(3, 3) + star(50, 44, 7.5, m);
    case 'CSM': return stack(3, 3) + `<circle cx="50" cy="44" r="9.5" fill="none" stroke="${m.edge}" stroke-width="2.2"/>` + star(50, 44, 6.5, m);
    case 'SMA': return stack(3, 3) + eagle(50, 44, 14, m) + star(38, 50, 3.5, m) + star(62, 50, 3.5, m);
    default: return null;
  }
}

function marines(r: Rank): string | null {
  const a = r.abbr;
  const m = GOLD;
  // Chevrons on top, the emblem in the gap, rockers below; sized so four rockers still fit.
  const layout = (c: number, k: number) => {
    const top = k ? 6 : c === 1 ? 18 : c === 2 ? 12 : 8;
    const end = top + (c - 1) * 9 + 17.5;
    let body = '';
    for (let i = 0; i < c; i += 1) body += chevron(top + i * 9, m, 72, 12, 5.5);
    for (let i = 0; i < k; i += 1) body += rocker(end + 20 + i * 7, m, 72, 6, 5.5);
    return { body, emblem: end + (k ? 10 : 15) };
  };
  const withRifles = (c: number, k: number) => { const l = layout(c, k); return l.body + rifles(l.emblem, m, k ? 20 : 26); };
  const withMark = (c: number, k: number, mark: (cy: number) => string) => { const l = layout(c, k); return l.body + mark(l.emblem); };
  switch (a) {
    case 'Pvt': return null;
    case 'PFC': return layout(1, 0).body;
    case 'LCpl': return withRifles(1, 0);
    case 'Cpl': return withRifles(2, 0);
    case 'Sgt': return withRifles(3, 0);
    case 'SSgt': return withRifles(3, 1);
    case 'GySgt': return withRifles(3, 2);
    case 'MSgt': return withRifles(3, 3);
    case '1stSgt': return withMark(3, 3, (y) => diamond(50, y, 6, m));
    case 'MGySgt': return withMark(3, 4, (y) => bomb(y - 1, m));
    case 'SgtMaj': return withMark(3, 4, (y) => star(50, y, 6.5, m));
    case 'SMMC': return withMark(3, 4, (y) => star(38, y, 4.5, m) + `<circle cx="50" cy="${y}" r="5" fill="${m.fill}" stroke="${m.edge}" stroke-width="1"/>` + star(62, y, 4.5, m));
    default: return null;
  }
}

/** Navy and Coast Guard petty officers and chiefs: an eagle over red or gold chevrons. */
function seaService(r: Rank): string | null {
  const a = r.abbr;
  const cg = r.branch === 'coast-guard';
  const m = RED;
  const crow = (n: number, chief: boolean, starsN: number) => {
    // Eagle on top, then (for chiefs) a rocker arching over, then chevrons pointing down.
    let body = eagle(50, 20, 22, SILVER);
    if (chief) body += rocker(44, m, 66, -9, 6);
    for (let i = 0; i < n; i += 1) body += chevronDown(36 + i * 11 + (chief ? 12 : 0), m);
    if (starsN) body = stars(starsN, 12, 4.5, SILVER) + body.replace('cy="20"', 'cy="24"');
    if (cg) body += `<path d="M44,82 L56,82 L56,89 Q56,94 50,96 Q44,94 44,89 Z" fill="${GOLD.fill}" stroke="${GOLD.edge}" stroke-width="1"/>`;
    return body;
  };
  const seaman = (n: number) => Array.from({ length: n }, (_, i) => `<rect x="${22 + i * 20}" y="20" width="12" height="60" rx="1.5" transform="rotate(-35 ${28 + i * 20} 50)" fill="#e8edf3" stroke="${NAVY_BLUE}" stroke-width="1.4"/>`).join('');
  switch (a) {
    case 'SR': return null;
    case 'SA': return seaman(2);
    case 'SN': return seaman(3);
    case 'PO3': return crow(1, false, 0);
    case 'PO2': return crow(2, false, 0);
    case 'PO1': return crow(3, false, 0);
    case 'CPO': return crow(3, true, 0);
    case 'SCPO': return crow(3, true, 1);
    case 'MCPO': return crow(3, true, 2);
    case 'CMDCM': case 'CMC': return crow(3, true, 2) + star(50, 32, 4, GOLD);
    case 'FLTCM/FORCM': return crow(3, true, 3);
    case 'MCPON': case 'MCPOCG': return crow(3, true, 3).replace(new RegExp(SILVER.fill, 'g'), GOLD.fill);
    default: return null;
  }
}

function airForce(r: Rank): string | null {
  const blue = '#2b4f8f';
  const m = SILVER;
  switch (r.abbr) {
    case 'AB': return null;
    case 'Amn': return airmanStripes(1, m, blue);
    case 'A1C': return airmanStripes(2, m, blue);
    case 'SrA': return airmanStripes(3, m, blue);
    case 'SSgt': return airmanStripes(4, m, blue);
    case 'TSgt': return airmanStripes(5, m, blue);
    case 'MSgt': return airmanStripes(6, m, blue);
    case 'SMSgt': return airmanStripes(7, m, blue);
    case 'CMSgt': case 'CCM': case 'CMSAF': return airmanStripes(8, m, blue);
    default: return null;
  }
}

/** Space Force enlisted: a simplified drawing (delta in a disc over stripes). */
function spaceForce(r: Rank): string | null {
  const m = SILVER;
  const navy = '#16233f';
  switch (r.abbr) {
    case 'Spc1': return null;
    case 'Spc2': return airmanStripes(1, m, navy, true);
    case 'Spc3': return airmanStripes(2, m, navy, true);
    case 'Spc4': return airmanStripes(3, m, navy, true);
    case 'Sgt': return airmanStripes(4, m, navy, true);
    case 'TSgt': return airmanStripes(5, m, navy, true);
    case 'MSgt': return airmanStripes(6, m, navy, true);
    case 'SMSgt': return airmanStripes(7, m, navy, true);
    case 'CMSgt': case 'CMSSF': return airmanStripes(8, m, navy, true);
    default: return null;
  }
}

/** Branches whose enlisted drawings are known to be only an outline of the real design. */
export const simplifiedEnlisted = new Set(['space-force', 'air-force']);

export function insigniaSvg(r: Rank): string | null {
  let body: string | null = null;
  if (r.category === 'officer') body = officer(r);
  else if (r.category === 'warrant') body = warrant(r);
  else if (r.branch === 'army') body = army(r);
  else if (r.branch === 'marine-corps') body = marines(r);
  else if (r.branch === 'navy' || r.branch === 'coast-guard') body = seaService(r);
  else if (r.branch === 'air-force') body = airForce(r);
  else if (r.branch === 'space-force') body = spaceForce(r);
  return body ? svg(body, `${r.title} insignia`) : null;
}

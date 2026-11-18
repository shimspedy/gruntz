import { useMemo, useState } from 'react';

/**
 * Ribbon rack builder. Pick ribbons, set devices, choose 3 or 4 per row, and download a
 * PNG. Ribbons line up in order of precedence: highest at the top on the wearer's right
 * (the viewer's left), full rows at the bottom, a short top row centred. Ribbons are
 * flat drawings from their stripe patterns; devices are simplified.
 */
type Ribbon = { name: string; order: number; type: string; stripes?: [string, number][] };
type Props = { awards: Ribbon[]; branch: string; total?: number };
type Held = { devices: number; v: boolean };

const W = 44; // stripe units across a ribbon (1/32 inch)
const H = 12; // 3/8 inch
const seaService = (b: string) => b === 'navy' || b === 'marine-corps' || b === 'coast-guard';

function starPath(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** SVG markup for one ribbon, so the same drawing serves the page and the PNG export. */
export function ribbonMarkup(stripes: [string, number][], held: Held | null, branch: string, x = 0, y = 0) {
  const total = stripes.reduce((s, [, w]) => s + w, 0) || W;
  const k = W / total;
  let cursor = 0;
  let out = '';
  for (const [c, w] of stripes) { out += `<rect x="${(x + cursor * k).toFixed(3)}" y="${y}" width="${(w * k + 0.04).toFixed(3)}" height="${H}" fill="${c}"/>`; cursor += w; }
  out += `<rect x="${x + 0.2}" y="${y + 0.2}" width="${W - 0.4}" height="${H - 0.4}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.4"/>`;
  if (held) {
    const silver = Math.floor(held.devices / 5);
    const bronze = held.devices % 5;
    const icons = [...Array(silver).fill('#d9dde3'), ...Array(bronze).fill(seaService(branch) ? '#d6ab3a' : '#a8743a')].slice(0, 4);
    const slots = icons.length + (held.v ? 1 : 0);
    const gap = 6.5;
    let cx = x + W / 2 - ((slots - 1) * gap) / 2;
    const cy = y + H / 2;
    const items = held.v ? [...icons.slice(0, Math.ceil(icons.length / 2)), 'V', ...icons.slice(Math.ceil(icons.length / 2))] : icons;
    for (const item of items) {
      if (item === 'V') out += `<text x="${cx}" y="${cy + 3.2}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="9" fill="#a8743a" stroke="#5a3d1c" stroke-width="0.3">V</text>`;
      else if (seaService(branch)) out += `<polygon points="${starPath(cx, cy, 3)}" fill="${item}" stroke="rgba(0,0,0,0.45)" stroke-width="0.3"/>`;
      else out += `<ellipse cx="${cx}" cy="${cy}" rx="1.9" ry="3.2" fill="${item}" stroke="rgba(0,0,0,0.45)" stroke-width="0.3"/><line x1="${cx}" y1="${cy - 2.6}" x2="${cx}" y2="${cy + 3.4}" stroke="rgba(0,0,0,0.4)" stroke-width="0.3"/>`;
      cx += gap;
    }
  }
  return out;
}

export function RibbonSvg({ stripes, title, width = 70 }: { stripes: [string, number][]; title: string; width?: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} role="img" aria-label={title} className="block shrink-0">
      <title>{title}</title>
      <g dangerouslySetInnerHTML={{ __html: ribbonMarkup(stripes, null, '') }} />
    </svg>
  );
}

const GAP = 1.2;

export default function RibbonRack({ awards, branch, total }: Props) {
  const drawable = useMemo(() => awards.filter((a) => a.stripes?.length).sort((a, b) => a.order - b.order), [awards]);
  const [held, setHeld] = useState<Map<string, Held>>(new Map());
  const [query, setQuery] = useState('');
  const [perRow, setPerRow] = useState(3);

  const chosen = drawable.filter((a) => held.has(a.name));
  const rows: Ribbon[][] = [];
  const lowestFirst = [...chosen].reverse();
  for (let i = 0; i < lowestFirst.length; i += perRow) rows.unshift(lowestFirst.slice(i, i + perRow).reverse());
  const shown = drawable.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (name: string) => setHeld((s) => { const n = new Map(s); if (n.has(name)) n.delete(name); else n.set(name, { devices: 0, v: false }); return n; });
  const update = (name: string, patch: Partial<Held>) => setHeld((s) => { const n = new Map(s); const cur = n.get(name); if (cur) n.set(name, { ...cur, ...patch }); return n; });

  /** The whole rack as one SVG, used for the preview and the download. */
  const rackSvg = () => {
    const width = perRow * W + (perRow - 1) * GAP;
    const height = rows.length * H + Math.max(0, rows.length - 1) * GAP;
    let body = '';
    rows.forEach((row, r) => {
      const rowWidth = row.length * W + (row.length - 1) * GAP;
      let x = (width - rowWidth) / 2;
      for (const a of row) { body += ribbonMarkup(a.stripes!, held.get(a.name) ?? null, branch, x, r * (H + GAP)); x += W + GAP; }
    });
    return { width, height, body };
  };

  const download = () => {
    const { width, height, body } = rackSvg();
    const scale = 12;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ribbon-rack-${branch}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const rack = rackSvg();
  const rackWidthPx = Math.min(360, perRow * 104);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 rounded-2xl border border-bone/10 bg-ink-2 p-5">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-bone-2">Find a ribbon</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${drawable.length} ribbons`}
            className="h-11 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] text-bone outline-none focus:border-accent" />
        </label>
        {total && total > drawable.length ? (
          <p className="mt-2 text-[13px] leading-5 text-bone-3">{drawable.length} of {total} ribbons can be drawn so far. The rest are listed below and are added as their official stripe patterns are confirmed.</p>
        ) : null}
        <ul className="mt-4 grid max-h-[560px] gap-1 overflow-y-auto pr-1">
          {shown.map((a) => {
            const h = held.get(a.name);
            return (
              <li key={a.name} className={`rounded-lg ${h ? 'bg-ink-3' : ''}`}>
                <label className="flex cursor-pointer items-center gap-3 px-2 py-2 hover:bg-ink-3 rounded-lg">
                  <input type="checkbox" checked={!!h} onChange={() => toggle(a.name)} className="h-4 w-4 shrink-0 accent-[#246dde]" />
                  <RibbonSvg stripes={a.stripes!} title={a.name} width={48} />
                  <span className="text-[15px] leading-snug text-bone">{a.name}</span>
                </label>
                {h ? (
                  <div className="flex flex-wrap items-center gap-3 px-2 pb-2 pl-9 text-[13px] text-bone-2">
                    <span>{seaService(branch) ? 'Stars' : 'Clusters'}</span>
                    <div className="inline-flex items-center rounded-lg border border-bone/15">
                      <button type="button" aria-label={`Fewer devices on ${a.name}`} onClick={() => update(a.name, { devices: Math.max(0, h.devices - 1) })} className="h-8 w-8 text-bone hover:bg-ink-4 rounded-l-lg">−</button>
                      <span className="w-7 text-center tabular-nums text-bone">{h.devices}</span>
                      <button type="button" aria-label={`More devices on ${a.name}`} onClick={() => update(a.name, { devices: Math.min(19, h.devices + 1) })} className="h-8 w-8 text-bone hover:bg-ink-4 rounded-r-lg">+</button>
                    </div>
                    {a.type === 'decoration' ? (
                      <label className="flex items-center gap-2"><input type="checkbox" checked={h.v} onChange={(e) => update(a.name, { v: e.target.checked })} className="h-4 w-4 accent-[#246dde]" />V device</label>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
          {!shown.length ? <li className="px-2 py-3 text-bone-3">No ribbon by that name.</li> : null}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="stamp">Your rack · {chosen.length}</p>
            <div className="inline-flex rounded-lg border border-bone/15 bg-ink-3 p-0.5" role="group" aria-label="Ribbons per row">
              {[3, 4].map((n) => (
                <button key={n} type="button" onClick={() => setPerRow(n)} aria-pressed={perRow === n}
                  className={`rounded-md px-3 py-1 text-[13px] transition-colors duration-150 ${perRow === n ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}>{n} per row</button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid min-h-[120px] place-items-center rounded-xl bg-[#26301f] p-5">
            {rows.length ? (
              <svg viewBox={`0 0 ${rack.width} ${rack.height}`} width={rackWidthPx} style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label={`Ribbon rack with ${chosen.length} ribbons`}>
                {rows.map((row, r) => {
                  const rowWidth = row.length * W + (row.length - 1) * GAP;
                  const start = (rack.width - rowWidth) / 2;
                  return row.map((a, i) => (
                    <g key={a.name} role="button" aria-label={`Remove ${a.name}`} style={{ cursor: 'pointer' }} onClick={() => toggle(a.name)}
                      dangerouslySetInnerHTML={{ __html: `<title>${a.name.replace(/[<&]/g, '')} (tap to remove)</title>` + ribbonMarkup(a.stripes!, held.get(a.name) ?? null, branch, start + i * (W + GAP), r * (H + GAP)) }} />
                  ));
                })}
              </svg>
            ) : <p className="text-center text-[15px] text-bone-2">Tick the ribbons you hold. They line up in order of precedence.</p>}
          </div>
          {rows.length ? <p className="mt-3 text-[13px] text-bone-3">Tap a ribbon in the rack to remove it.</p> : null}
          <button type="button" onClick={download} disabled={!rows.length}
            className="mt-5 h-11 w-full rounded-xl bg-accent text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hi disabled:opacity-40">Download PNG</button>
          <p className="mt-5 text-[13px] leading-5 text-bone-3">Flat drawings from the official stripe patterns, with simplified devices. Check your branch’s uniform regulation for device placement and spacing.</p>
        </div>
      </aside>
    </div>
  );
}

import { useState } from 'react';
import { jepes as J, jepesScore, type JepesRank } from '../../data/tools/career/marine-corps';

/** JEPES PES score estimate. Percentiles and marks come from the Marine's own record. */
const n = (s: string) => Math.max(0, Number(s) || 0);

function Num({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-bone-2">{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
        className="h-11 w-28 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent" />
      {hint ? <span className="text-[13px] leading-5 text-bone-3">{hint}</span> : null}
    </label>
  );
}

export default function JepesCalculator() {
  const [rank, setRank] = useState<JepesRank>('LCpl and below');
  const belts = J.mcmapPoints[rank];
  const [belt, setBelt] = useState(belts[0]?.code ?? '');
  const [v, setV] = useState({ rifle: '', pft: '', cft: '', mos: '', ceu: '', inGrade: '', inService: '', mosMission: '', leadership: '', character: '', schools: '', referrals: '' });
  const [degree, setDegree] = useState<'none' | 'associate' | 'bachelor'>('none');
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const r = jepesScore({
    rank, riflePct: n(v.rifle), pftPct: n(v.pft), cftPct: n(v.cft), mcmapCode: belt,
    mosQualPoints: n(v.mos), marineNetCeu: n(v.ceu), degree, coursesInGrade: n(v.inGrade), coursesInService: n(v.inService),
    marks: { mosMission: n(v.mosMission), leadership: n(v.leadership), character: n(v.character) },
    bonusSchools: n(v.schools), recruitingReferrals: n(v.referrals),
  });
  const rows = [
    { name: 'Warfighting', pts: r.warfighting, max: 250 },
    { name: 'Physical toughness', pts: r.physical, max: 250 },
    { name: 'Mental agility', pts: r.mental, max: 250 },
    { name: 'Command input', pts: r.command, max: 250 },
    { name: 'Bonus', pts: r.bonus, max: 100 },
  ];
  const card = 'rounded-2xl border border-bone/10 bg-ink-2 p-4';
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="grid min-w-0 gap-5" onSubmit={(e) => e.preventDefault()} aria-label="JEPES calculator">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-bone-2">Your rank</legend>
          <div className="inline-flex rounded-xl border border-bone/15 bg-ink-3 p-1">
            {(Object.keys(J.mcmapPoints) as JepesRank[]).map((k) => (
              <label key={k} className={`cursor-pointer rounded-lg px-4 py-2 text-[15px] transition-colors duration-150 ${rank === k ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}>
                <input type="radio" name="rank" checked={rank === k} onChange={() => { setRank(k); setBelt(J.mcmapPoints[k][0]?.code ?? ''); }} className="sr-only" />{k}
              </label>
            ))}
          </div>
        </fieldset>
        <div className={card}>
          <p className="text-[15px] font-semibold">Warfighting and physical toughness</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Num label="Rifle percentile" value={v.rifle} onChange={set('rifle')} hint="0–100, from your record" />
            <Num label="PFT percentile" value={v.pft} onChange={set('pft')} hint="0–100" />
            <Num label="CFT percentile" value={v.cft} onChange={set('cft')} hint="0–100" />
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-sm font-medium text-bone-2">MCMAP belt</span>
            <select value={belt} onChange={(e) => setBelt(e.target.value)} className="h-11 max-w-sm rounded-xl border border-bone/15 bg-ink-3 px-3 text-[15px] text-bone outline-none focus:border-accent">
              {belts.map((b) => <option key={b.code} value={b.code}>{b.belt} ({b.points} pts)</option>)}
            </select>
          </label>
        </div>
        <div className={card}>
          <p className="text-[15px] font-semibold">Mental agility</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Num label="MOS qualification points" value={v.mos} onChange={set('mos')} hint="Up to 100" />
            <Num label="MarineNet CEUs" value={v.ceu} onChange={set('ceu')} hint="Up to 40" />
            <Num label="Courses in grade" value={v.inGrade} onChange={set('inGrade')} hint="5 each, up to 20" />
            <Num label="Courses in service" value={v.inService} onChange={set('inService')} hint="5 each, up to 20" />
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-sm font-medium text-bone-2">Degree</span>
            <select value={degree} onChange={(e) => setDegree(e.target.value as typeof degree)} className="h-11 max-w-xs rounded-xl border border-bone/15 bg-ink-3 px-3 text-[15px] text-bone outline-none focus:border-accent">
              <option value="none">None</option><option value="associate">Associate (10)</option><option value="bachelor">Bachelor’s (20)</option>
            </select>
          </label>
        </div>
        <div className={card}>
          <p className="text-[15px] font-semibold">Command input and bonus</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Num label="MOS/mission mark" value={v.mosMission} onChange={set('mosMission')} hint="0–5" />
            <Num label="Leadership mark" value={v.leadership} onChange={set('leadership')} hint="0–5" />
            <Num label="Character mark" value={v.character} onChange={set('character')} hint="0–5" />
            <Num label="Bonus schools" value={v.schools} onChange={set('schools')} hint="50 each" />
            <Num label="Recruiting referrals" value={v.referrals} onChange={set('referrals')} hint="20 each" />
          </div>
        </div>
      </form>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6" aria-live="polite">
          <p className="stamp">Estimated PES score</p>
          <p className="mt-2 text-[56px] font-bold leading-none tabular-nums [font-stretch:112%]">{r.total}<span className="text-xl text-bone-3"> / {J.maxScore}</span></p>
          <ul className="mt-5 grid gap-2">
            {rows.map((x) => (
              <li key={x.name}>
                <div className="flex justify-between text-[13px] text-bone-2"><span>{x.name}</span><span className="tabular-nums">{x.pts} / {x.max}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-4"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(x.pts / x.max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] leading-5 text-bone-3">Unofficial estimate. Percentiles come from HQMC tables that change each year; use the ones in your record. MCTFS holds your official score.</p>
        </div>
      </aside>
    </div>
  );
}

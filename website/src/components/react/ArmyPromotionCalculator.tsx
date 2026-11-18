import { useState } from 'react';
import { promotionPoints as P, type PromotionGrade } from '../../data/tools/career/army';

/**
 * Army semi-centralized promotion points estimate (SGT and SSG). Weapons and AFT use the
 * published conversion tables; the rest is entered by the soldier and held to the
 * category ceilings. An unofficial estimate: HRC computes the real total each month.
 */
const lookup = (rows: [number, number, number][], value: number) => rows.find(([lo, hi]) => value >= lo && value <= hi)?.[2] ?? 0;
const n = (s: string) => Math.max(0, Number(s) || 0);

function Num({ label, value, onChange, hint, max }: { label: string; value: string; onChange: (v: string) => void; hint?: string; max?: number }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-bone-2">{label}</span>
      <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, max != null ? String(max).length + 1 : 4))}
        className="h-11 w-32 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent" />
      {hint ? <span className="text-[13px] text-bone-3">{hint}</span> : null}
    </label>
  );
}

export default function ArmyPromotionCalculator() {
  const [grade, setGrade] = useState<PromotionGrade>('SGT');
  const [form, setForm] = useState(0);
  const [v, setV] = useState({ hits: '', aft: '', awards: '', resWeeks: '', cbtHours: '', semHours: '', certs: '' });
  const [degree, setDegree] = useState(false);
  const [dlpt, setDlpt] = useState(false);
  const [bonus, setBonus] = useState(-1);
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));

  const cat = (id: string) => P.categories.find((c) => c.id === id)!;
  const part = (id: string, i: number) => cat(id).parts[i];
  const cap = (x: number, m: number) => Math.min(x, m);

  const table = P.weapons[grade][form] ?? P.weapons[grade][0];
  const weapons = v.hits ? cap(lookup(table.rows, n(v.hits)), part('military-training', 0).max[grade]) : 0;
  const aft = v.aft ? lookup(P.aftPoints, n(v.aft)) : 0;
  const training = cap(weapons + aft, cat('military-training').max[grade]);
  const awards = cap(n(v.awards), cat('awards').max[grade]);
  const resident = cap(n(v.resWeeks) * 4, part('military-education', 0).max[grade]);
  const cbt = cap(Math.floor(n(v.cbtHours) / 5), part('military-education', 1).max[grade]);
  const education = cap(resident + cbt, cat('military-education').max[grade]);
  const civ = cap(
    cap(n(v.semHours) * 2, part('civilian-education', 0).max[grade]) + (degree ? 20 : 0) + cap(Math.min(5, n(v.certs)) * 10, 50) + (dlpt ? 25 : 0),
    cat('civilian-education').max[grade],
  );
  const extra = bonus >= 0 ? P.bonuses[bonus].points : 0;
  const total = training + awards + education + civ + extra;

  const rows = [
    { name: 'Military training', pts: training, max: cat('military-training').max[grade] },
    { name: 'Awards and achievements', pts: awards, max: cat('awards').max[grade] },
    { name: 'Military education', pts: education, max: cat('military-education').max[grade] },
    { name: 'Civilian education', pts: civ, max: cat('civilian-education').max[grade] },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="grid min-w-0 gap-5" onSubmit={(e) => e.preventDefault()} aria-label="Army promotion points calculator">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-bone-2">Promotion to</legend>
          <div className="inline-flex rounded-xl border border-bone/15 bg-ink-3 p-1">
            {(['SGT', 'SSG'] as PromotionGrade[]).map((g) => (
              <label key={g} className={`cursor-pointer rounded-lg px-4 py-2 text-[15px] transition-colors duration-150 ${grade === g ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}>
                <input type="radio" name="grade" checked={grade === g} onChange={() => setGrade(g)} className="sr-only" />{g}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-4">
          <p className="text-[15px] font-semibold">Military training</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-bone-2">Weapons qualification scorecard</span>
              <select value={form} onChange={(e) => setForm(Number(e.target.value))} className="h-11 w-full min-w-0 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[15px] text-bone outline-none focus:border-accent">
                {P.weapons[grade].map((t, i) => <option key={t.form} value={i}>{t.weapons} ({t.form})</option>)}
              </select>
            </label>
            <Num label="Hits" value={v.hits} onChange={set('hits')} hint={`${weapons} points`} />
            <Num label="Last record AFT total" value={v.aft} onChange={set('aft')} hint={`${aft} points (all events passed)`} max={500} />
          </div>
        </div>

        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-4">
          <p className="text-[15px] font-semibold">Awards and military education</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Num label="Award and badge points" value={v.awards} onChange={set('awards')} hint="From your record" />
            <Num label="Resident course weeks" value={v.resWeeks} onChange={set('resWeeks')} hint="4 points per week" />
            <Num label="Online course hours" value={v.cbtHours} onChange={set('cbtHours')} hint="1 point per 5 hours" />
          </div>
        </div>

        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-4">
          <p className="text-[15px] font-semibold">Civilian education and bonuses</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Num label="College semester hours" value={v.semHours} onChange={set('semHours')} hint="2 points each" />
            <Num label="Technical certifications" value={v.certs} onChange={set('certs')} hint="10 points each, up to 5" />
          </div>
          <div className="mt-4 grid gap-2 text-[15px] text-bone">
            <label className="flex items-center gap-3"><input type="checkbox" checked={degree} onChange={(e) => setDegree(e.target.checked)} className="h-4 w-4 accent-[#246dde]" />Degree completed while serving (20)</label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={dlpt} onChange={(e) => setDlpt(e.target.checked)} className="h-4 w-4 accent-[#246dde]" />DLPT 1/1 or oral 1 in the last year (25)</label>
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-sm font-medium text-bone-2">Airborne advantage</span>
            <select value={bonus} onChange={(e) => setBonus(Number(e.target.value))} className="h-11 w-full min-w-0 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[15px] text-bone outline-none focus:border-accent">
              <option value={-1}>None</option>
              {P.bonuses.map((b, i) => <option key={b.name} value={i}>{b.name} (+{b.points})</option>)}
            </select>
          </label>
        </div>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6" aria-live="polite">
          <p className="stamp">Estimated points</p>
          <p className="mt-2 text-[56px] font-bold leading-none tabular-nums [font-stretch:112%]">{total}<span className="text-xl text-bone-3"> / {P.maxTotal[grade]}</span></p>
          <ul className="mt-5 grid gap-2">
            {rows.map((r) => (
              <li key={r.name}>
                <div className="flex justify-between text-[13px] text-bone-2"><span>{r.name}</span><span className="tabular-nums">{r.pts} / {r.max}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-4"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(r.pts / r.max) * 100}%` }} /></div>
              </li>
            ))}
            {extra ? <li className="text-[13px] text-bone-2">Airborne bonus +{extra}</li> : null}
          </ul>
          <p className="mt-5 text-[13px] leading-5 text-bone-3">Unofficial estimate. Graduating BLC or ALC adds points the regulation counts separately, not shown here. HRC computes your real total every month.</p>
        </div>
      </aside>
    </div>
  );
}

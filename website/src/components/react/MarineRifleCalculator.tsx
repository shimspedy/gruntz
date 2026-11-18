import { useState } from 'react';
import { arqClassification, rifleQualification as R } from '../../data/tools/career/marine-corps';

/** ARQ classification from Destroys and drill types passed, read off the scorecard matrix. */
export default function MarineRifleCalculator() {
  const [destroys, setDestroys] = useState('');
  const [drills, setDrills] = useState(0);
  const d = destroys.trim() ? Math.min(R.maxDestroys, Math.max(0, Math.floor(Number(destroys) || 0))) : null;
  const result = d == null ? null : arqClassification(d, drills);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="grid gap-5 rounded-2xl border border-bone/10 bg-ink-2 p-5" onSubmit={(e) => e.preventDefault()} aria-label="Rifle qualification calculator">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-bone-2">Destroys</span>
          <input inputMode="numeric" value={destroys} onChange={(e) => setDestroys(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} placeholder={`0–${R.maxDestroys}`}
            className="h-11 w-32 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent" />
          <span className="text-[13px] text-bone-3">Targets destroyed across the scored stages, out of {R.maxDestroys}</span>
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-bone-2">Drill types passed</legend>
          <div className="inline-flex rounded-xl border border-bone/15 bg-ink-3 p-1">
            {[0, 1, 2, 3].map((n) => (
              <label key={n} className={`cursor-pointer rounded-lg px-4 py-2 text-[15px] tabular-nums transition-colors duration-150 ${drills === n ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}>
                <input type="radio" name="drills" checked={drills === n} onChange={() => setDrills(n)} className="sr-only" />{n}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-bone-3">{R.drillTypes.join(', ')}</p>
        </fieldset>
      </form>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6" aria-live="polite">
          <p className="stamp">Qualification</p>
          <p className="mt-2 text-[44px] font-bold leading-none [font-stretch:112%]">{result ?? '–'}</p>
          <p className="mt-3 text-[15px] text-bone-2">{result ? `${d} destroys with ${drills} drill type${drills === 1 ? '' : 's'} passed.` : 'Enter your destroys to see your badge.'}</p>
          <p className="mt-5 text-[13px] leading-5 text-bone-3">Unofficial estimate from the ARQ scorecard matrix. Only the score recorded by your range counts.</p>
        </div>
      </aside>
    </div>
  );
}

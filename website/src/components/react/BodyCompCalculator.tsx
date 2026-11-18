import { useEffect, useState } from 'react';
import { bodyFatPercent, maxBodyFat, maxWeightFor, meetsRatio, waistToHeight } from '../../data/tools/score';
import type { BodyCompStandard, BodyMeasurements, Sex } from '../../data/tools/types';

/**
 * Height/weight screen plus the branch's body-fat or waist-to-height check.
 * Loads only this branch's standard. Results are an unofficial estimate.
 */
const modules = import.meta.glob<Record<string, unknown>>('../../data/tools/body-comp/*.ts');

const isStandard = (v: unknown): v is BodyCompStandard => !!v && typeof v === 'object' && 'heightWeight' in v && 'method' in v;

function Field({ label, value, onChange, unit, hint }: { label: string; value: string; onChange: (v: string) => void; unit: string; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-bone-2">{label}</span>
      <span className="flex items-center gap-2">
        <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
          className="h-11 w-28 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent" />
        <span className="text-sm text-bone-3">{unit}</span>
      </span>
      {hint ? <span className="text-[13px] text-bone-3">{hint}</span> : null}
    </label>
  );
}

export default function BodyCompCalculator({ branch }: { branch: string }) {
  const [standard, setStandard] = useState<BodyCompStandard | null>(null);
  const [lookup, setLookup] = useState<((sex: Sex, m: BodyMeasurements) => number | null) | null>(null);
  const [failed, setFailed] = useState(false);
  const [sex, setSex] = useState<Sex>('male');
  const [v, setV] = useState({ age: '25', height: '', weight: '', abdomen: '', neck: '', waist: '', hip: '' });
  const set = (k: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [k]: value }));

  useEffect(() => {
    const load = modules[`../../data/tools/body-comp/${branch}.ts`];
    if (!load) { setFailed(true); return; }
    load().then((mod) => {
      const found = Object.values(mod).find(isStandard);
      if (typeof mod.lookupBodyFat === 'function') setLookup(() => mod.lookupBodyFat as (sex: Sex, m: BodyMeasurements) => number | null);
      if (found) setStandard(found); else setFailed(true);
    }).catch(() => setFailed(true));
  }, [branch]);

  if (failed) return <p className="text-bone-2">The calculator could not load. The full standards are below.</p>;
  if (!standard) return <p className="text-bone-2" aria-live="polite">Loading the calculator…</p>;

  const num = (s: string) => (s.trim() ? Number(s) : NaN);
  const age = Math.min(99, Math.max(17, Math.round(num(v.age) || 0)));
  const height = num(v.height);
  const weight = num(v.weight);
  const screen = Number.isFinite(height) ? maxWeightFor(standard, sex, age, height) : null;
  const overWeight = screen && Number.isFinite(weight) ? weight > screen.maxLb : null;
  const fatLimit = maxBodyFat(standard, sex, age);
  const fat = standard.method === 'waist-to-height' ? null : bodyFatPercent(standard.method, sex, {
    heightIn: height, weightLb: weight, abdomenIn: num(v.abdomen), neckIn: num(v.neck), waistIn: num(v.waist), hipIn: num(v.hip),
  });
  // Round the way the service records measurements, when it says how.
  const half = (x: number, up: boolean) => (up ? Math.ceil(x * 2) : Math.floor(x * 2)) / 2;
  const hRule = standard.measureRounding?.height;
  const hRec = hRule && hRule !== 'none' && Number.isFinite(height) ? half(height, hRule === 'half-up') : height;
  const wRec = standard.measureRounding?.waist === 'half-down' && Number.isFinite(num(v.waist)) ? half(num(v.waist), false) : num(v.waist);
  const ratio = standard.method === 'waist-to-height' ? waistToHeight(wRec, hRec, standard.waistToHeightRule) : null;
  const ratioOk = ratio == null ? null : meetsRatio(ratio, standard);
  const below = standard.waistToHeightRule?.strictlyBelow;
  const hasTable = standard.heightWeight.length > 0;
  const extraWeight = !!standard.bodyFatAfterRatio?.[sex].includes('weight');
  const needsFat = !!standard.bodyFatAfterRatio && ratioOk === false;
  const extra = needsFat ? standard.bodyFatAfterRatio![sex] : [];
  const tableFat = needsFat && lookup
    ? lookup(sex, { heightIn: hRec, waistIn: wRec, weightLb: Number.isFinite(weight) ? weight : undefined, neckIn: num(v.neck) || undefined, hipIn: num(v.hip) || undefined })
    : null;
  const missing = extra.some((k) => !Number.isFinite(num(k === 'weight' ? v.weight : v[k])));
  const multi = standard.method === 'dod-multi-site';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="grid min-w-0 gap-5" onSubmit={(e) => e.preventDefault()} aria-label="Body composition calculator">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-bone-2">Sex</legend>
          <div className="inline-flex rounded-xl border border-bone/15 bg-ink-3 p-1">
            {(['male', 'female'] as Sex[]).map((s) => (
              <label key={s} className={`cursor-pointer rounded-lg px-4 py-2 text-[15px] transition-colors duration-150 ${sex === s ? 'bg-bone text-ink' : 'text-bone-2 hover:text-bone'}`}>
                <input type="radio" name="sex" value={s} checked={sex === s} onChange={() => setSex(s)} className="sr-only" />
                {s === 'male' ? 'Male' : 'Female'}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Age" value={v.age} onChange={set('age')} unit="years" />
          <Field label="Height" value={v.height} onChange={set('height')} unit="in" hint={standard.method === 'waist-to-height' ? 'As measured' : 'Whole inches, as measured'} />
          {hasTable || standard.method === 'dod-one-site' || extraWeight ? <Field label="Weight" value={v.weight} onChange={set('weight')} unit="lb" /> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {standard.method === 'dod-one-site' ? <Field label="Abdomen" value={v.abdomen} onChange={set('abdomen')} unit="in" hint="At the navel" /> : null}
          {multi || (needsFat && extra.includes('neck')) ? <Field label="Neck" value={v.neck} onChange={set('neck')} unit="in" hint={needsFat ? 'For the follow-up check' : undefined} /> : null}
          {needsFat && extra.includes('hip') ? <Field label="Hip" value={v.hip} onChange={set('hip')} unit="in" hint="For the follow-up check" /> : null}
          {multi && sex === 'male' ? <Field label="Abdomen" value={v.abdomen} onChange={set('abdomen')} unit="in" /> : null}
          {(multi && sex === 'female') || standard.method === 'waist-to-height' ? <Field label="Waist" value={v.waist} onChange={set('waist')} unit="in" /> : null}
          {multi && sex === 'female' ? <Field label="Hip" value={v.hip} onChange={set('hip')} unit="in" /> : null}
        </div>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="grid gap-5 rounded-2xl border border-bone/10 bg-ink-2 p-6" aria-live="polite">
          {hasTable ? <div>
            <p className="stamp">Weight screen</p>
            {screen ? (
              <>
                <p className="mt-2 text-[28px] font-bold leading-tight tabular-nums [font-stretch:112%]">
                  {screen.minLb ? `${screen.minLb}–` : 'Up to '}{screen.maxLb} lb
                </p>
                <p className="mt-1 text-[15px] text-bone-2">
                  {overWeight == null ? 'Allowed at this height.' : overWeight ? 'Over the screening weight: a body fat check applies.' : 'Within the screening weight.'}
                </p>
              </>
            ) : <p className="mt-2 text-[15px] text-bone-3">Enter a height on the chart to see the screening weight.</p>}
          </div> : null}
          {standard.method === 'waist-to-height' ? (
            <div>
              <p className="stamp">Waist-to-height</p>
              <p className="mt-2 text-[28px] font-bold leading-tight tabular-nums">{ratio ?? '–'}</p>
              <p className="mt-1 text-[15px] text-bone-2">
                {ratio == null ? 'Enter waist and height.' : ratioOk == null ? '' : ratioOk
                  ? `Meets the standard (${below ? 'below' : 'at or under'} ${standard.waistToHeightMax}).`
                  : `Does not meet the standard (${below ? 'must be below' : 'must be at or under'} ${standard.waistToHeightMax}).`}
              </p>
            </div>
          ) : null}
          {needsFat ? (
            <div>
              <p className="stamp">Body fat check</p>
              <p className="mt-2 text-[28px] font-bold leading-tight tabular-nums">{tableFat != null ? `${tableFat}%` : '–'}</p>
              <p className="mt-1 text-[15px] text-bone-2">
                {missing ? `Enter your ${extra.join(' and ').replace('weight', 'weight')} for this check.` : tableFat == null ? 'Outside the published table; the official system computes it.' : fatLimit == null ? '' : tableFat <= fatLimit ? `Within the ${fatLimit}% maximum.` : `Over the ${fatLimit}% maximum.`}
              </p>
            </div>
          ) : null}
          {standard.method !== 'waist-to-height' ? (
            <div>
              <p className="stamp">Estimated body fat</p>
              <p className="mt-2 text-[28px] font-bold leading-tight tabular-nums">{fat != null ? `${fat}%` : '–'}</p>
              <p className="mt-1 text-[15px] text-bone-2">
                {fatLimit == null ? '' : fat == null ? `Maximum for your age: ${fatLimit}%.` : fat <= fatLimit ? `Within the ${fatLimit}% maximum.` : `Over the ${fatLimit}% maximum.`}
              </p>
            </div>
          ) : null}
          <p className="text-[13px] leading-5 text-bone-3">Unofficial estimate. Only the measurement taken under your service's procedure counts.</p>
        </div>
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { formatTime, maxPerformance, minimumPerformance, parseTime, scoreTest } from '../../data/tools/score';
import type { FitnessEvent, FitnessTest, Sex } from '../../data/tools/types';

/**
 * A score calculator for one fitness test. The chart is loaded on demand so each page
 * ships only its own test. Results are an unofficial estimate.
 */
const modules = import.meta.glob<Record<string, unknown>>('../../data/tools/fitness/*.ts');

type Props = { branch: string; testId: string };

const isTest = (value: unknown): value is FitnessTest =>
  !!value && typeof value === 'object' && 'slots' in value && 'id' in value;

function display(event: FitnessEvent, value: number | null): string {
  if (value == null) return '–';
  if (event.unit === 'ratio') return value.toFixed(2);
  return event.unit === 'seconds' ? formatTime(value) : `${value}${event.unit === 'meters' ? ' m' : event.unit === 'pounds' ? ' lb' : ''}`;
}

function readValue(event: FitnessEvent, text: string): number | null {
  if (!text.trim()) return null;
  if (event.unit === 'seconds') return parseTime(text);
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  // Waist-to-height is cut (not rounded) to two decimals before the chart is read.
  return event.unit === 'ratio' ? (n > 0 && n < 2 ? Math.floor(n * 100 + 1e-9) / 100 : null) : n;
}

export default function FitnessCalculator({ branch, testId }: Props) {
  const [test, setTest] = useState<FitnessTest | null>(null);
  const [failed, setFailed] = useState(false);
  const [sex, setSex] = useState<Sex>('male');
  const [ageText, setAgeText] = useState('25');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = modules[`../../data/tools/fitness/${branch}.ts`];
    if (!load) { setFailed(true); return; }
    load().then((mod) => {
      const found = Object.values(mod).find((v) => isTest(v) && v.id === testId);
      if (isTest(found)) setTest(found); else setFailed(true);
    }).catch(() => setFailed(true));
  }, [branch, testId]);

  const age = Math.min(99, Math.max(17, Math.round(Number(ageText) || 0)));
  const eventFor = (slotId: string) => {
    const slot = test?.slots.find((s) => s.id === slotId);
    return slot?.options.find((o) => o.id === chosen[slotId]) ?? slot?.options[0];
  };

  const result = useMemo(() => {
    if (!test) return null;
    const entries: Record<string, { eventId: string; value: number | null }> = {};
    for (const slot of test.slots) {
      const event = eventFor(slot.id)!;
      entries[slot.id] = { eventId: event.id, value: readValue(event, inputs[slot.id] ?? '') };
    }
    return scoreTest(test, sex, age, entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, sex, age, chosen, inputs]);

  if (failed) return <p className="text-bone-2">The calculator could not load. The full score chart is below.</p>;
  if (!test || !result) return <p className="text-bone-2" aria-live="polite">Loading the calculator…</p>;

  const anyInput = Object.values(inputs).some((v) => v.trim());
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="grid min-w-0 gap-5" onSubmit={(e) => e.preventDefault()} aria-label={`${test.short} calculator`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {test.bySex ? (
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
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-medium text-bone-2">Age</span>
            <input inputMode="numeric" value={ageText} onChange={(e) => setAgeText(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
              className="h-11 w-28 rounded-xl border border-bone/15 bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent" />
          </label>
        </div>

        {test.slots.map((slot) => {
          const event = eventFor(slot.id)!;
          const points = result.slots.find((s) => s.slotId === slot.id)?.points ?? 0;
          const best = maxPerformance(event, sex, age);
          const floor = slot.minimumPoints != null ? minimumPerformance(event, sex, age, slot.minimumPoints) : null;
          const typed = inputs[slot.id] ?? '';
          const invalid = typed.trim() !== '' && readValue(event, typed) == null;
          return (
            <div key={slot.id} className="rounded-2xl border border-bone/10 bg-ink-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {slot.options.length > 1 ? (
                  <label className="grid gap-1">
                    <span className="text-sm font-medium text-bone-2">{slot.label}</span>
                    <select value={event.id} onChange={(e) => setChosen((c) => ({ ...c, [slot.id]: e.target.value }))}
                      className="h-10 rounded-lg border border-bone/15 bg-ink-3 px-2 text-[15px] text-bone outline-none focus:border-accent">
                      {slot.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </label>
                ) : (
                  <span className="text-[15px] font-semibold">{event.name}</span>
                )}
                <span className="stamp tabular-nums" aria-live="polite">{points} pts</span>
              </div>
              <label className="mt-3 grid gap-1">
                <span className="sr-only">{event.name} {event.unit === 'seconds' ? 'time' : 'result'}</span>
                <input
                  inputMode={event.unit === 'seconds' ? 'text' : event.unit === 'ratio' ? 'decimal' : 'numeric'}
                  placeholder={event.unit === 'seconds' ? 'mm:ss' : event.unit === 'reps' ? 'Reps' : event.unit === 'meters' ? 'Meters' : event.unit === 'ratio' ? 'Waist ÷ height, e.g. 0.50' : 'Pounds'}
                  value={typed}
                  onChange={(e) => setInputs((v) => ({ ...v, [slot.id]: e.target.value.slice(0, 8) }))}
                  aria-invalid={invalid}
                  className={`h-11 w-full rounded-xl border bg-ink-3 px-3 text-[16px] tabular-nums text-bone outline-none focus:border-accent ${invalid ? 'border-red-400/70' : 'border-bone/15'}`}
                />
              </label>
              <p className="mt-2 text-[13px] leading-5 text-bone-3">
                {best != null ? <>Max points at {display(event, best)}</> : 'Not scored for this age and sex'}
                {floor != null ? <> · minimum {display(event, floor)}</> : null}
                {invalid ? <span className="text-red-300"> · enter {event.unit === 'seconds' ? 'a time like 18:30' : event.unit === 'ratio' ? 'a ratio like 0.50' : 'a number'}</span> : null}
              </p>
            </div>
          );
        })}
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-bone/10 bg-ink-2 p-6" aria-live="polite">
          <p className="stamp">Estimated total</p>
          <p className="mt-2 text-[56px] font-bold leading-none tabular-nums [font-stretch:112%]">{result.total}<span className="text-xl text-bone-3"> / {test.maxPoints}</span></p>
          {anyInput ? (
            <p className="mt-3 text-[15px] text-bone-2">
              {result.className ? <strong className="text-bone">{result.className}</strong> : null}
              {result.className && result.passing != null ? ' · ' : ''}
              {result.passing === true ? 'Meets the minimums' : result.passing === false ? 'Below a minimum' : ''}
            </p>
          ) : <p className="mt-3 text-[15px] text-bone-3">Enter your results to see the estimate.</p>}
          <ul className="mt-5 grid gap-2">
            {result.slots.map((s) => {
              const slot = test.slots.find((x) => x.id === s.slotId)!;
              const event = slot.options.find((o) => o.id === s.eventId)!;
              const top = Math.max(1, ...((event.brackets[0]?.points ?? []).map(([, p]) => p)));
              return (
                <li key={s.slotId}>
                  <div className="flex justify-between text-[13px] text-bone-2"><span>{event.name}</span><span className="tabular-nums">{s.points}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-4"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.min(100, (s.points / top) * 100)}%` }} /></div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-[13px] leading-5 text-bone-3">Unofficial estimate from the published chart. Your command's scored test is the only official result.</p>
        </div>
      </aside>
    </div>
  );
}

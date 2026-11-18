import { useState } from 'react';

/** Type a name, callsign or code and read it back in the phonetic alphabet. */
type Props = { letters: { letter: string; word: string }[]; digits: { digit: string; word: string }[] };

export default function PhoneticSpeller({ letters, digits }: Props) {
  const [text, setText] = useState('');
  const map = new Map<string, string>([...letters.map((l) => [l.letter.toUpperCase(), l.word] as const), ...digits.map((d) => [d.digit, d.word] as const)]);
  const chars = [...text.toUpperCase()].slice(0, 60);
  return (
    <div className="rounded-2xl border border-bone/10 bg-ink-2 p-5 md:p-6">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-bone-2">Spell it out</span>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a name or callsign, e.g. GRUNTZ 6"
          autoCapitalize="characters" autoComplete="off" spellCheck={false}
          className="h-12 w-full rounded-xl border border-bone/15 bg-ink-3 px-4 text-[17px] text-bone outline-none focus:border-accent" />
      </label>
      <ol className="mt-4 flex min-h-[44px] flex-wrap gap-2" aria-live="polite">
        {chars.map((c, i) => {
          const word = map.get(c);
          if (c === ' ') return <li key={i} className="w-3" aria-hidden="true" />;
          return (
            <li key={i} className={`rounded-lg px-3 py-1.5 text-[15px] ${word ? 'bg-ink-3 text-bone' : 'text-bone-3'}`}>
              {word ? <><span className="font-mono text-accent-text">{c}</span> {word}</> : c}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

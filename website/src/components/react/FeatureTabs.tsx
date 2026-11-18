import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';

export interface Feature {
  name: string;
  short: string;
  headline: string;
  copy: string;
  screen: string;
}
export interface FeatureTabsProps {
  features: Feature[];
  label: string;
  screenAlt: string;
  note: string;
}

/** Feature picker beside one large phone. Radix Tabs gives the roving focus and arrow keys. */
export default function FeatureTabs({ features, label, screenAlt, note }: FeatureTabsProps) {
  const [value, setValue] = useState('f0');
  const active = Number(value.slice(1));
  return (
    <Tabs.Root value={value} onValueChange={setValue} orientation="vertical" className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div>
        <Tabs.List aria-label={label} className="flex flex-col border-t border-bone/10">
          {features.map((f, i) => (
            <Tabs.Trigger
              key={f.name}
              value={`f${i}`}
              className="group grid grid-cols-[32px_1fr] items-baseline gap-x-3 border-b border-bone/10 py-4 text-left transition-colors duration-150 ease-out"
            >
              <span className="stamp group-data-[state=active]:text-accent-text">{i + 1}</span>
              <span>
                <span className="block text-lg font-semibold leading-snug text-bone-2 transition-colors duration-150 ease-out group-hover:text-bone group-data-[state=active]:text-bone">
                  {f.name}
                </span>
                <span className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 ease-out opacity-0 group-data-[state=active]:grid-rows-[1fr] group-data-[state=active]:opacity-100 max-lg:hidden">
                  <span className="overflow-hidden">
                    <span className="block pt-2 text-[15px] leading-relaxed text-bone-2">{f.copy}</span>
                  </span>
                </span>
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <p className="mt-6 max-w-[52ch] text-[13px] leading-5 text-bone-3">{note}</p>
      </div>

      <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[20px] border border-bone/10 bg-ink-2 px-6 py-10 sm:min-h-[680px]">
        {features.map((f, i) => (
          <Tabs.Content key={f.name} value={`f${i}`} forceMount className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 py-10 transition-opacity duration-300 ease-out data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0">
            <div className="lg:hidden max-w-[40ch] text-center">
              <p className="text-lg font-semibold leading-snug">{f.headline}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-bone-2">{f.copy}</p>
            </div>
            <div className="phone w-[240px] sm:w-[280px]">
              <img src={f.screen} alt={`${f.name} ${screenAlt}`} width={402} height={874} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </div>
          </Tabs.Content>
        ))}
        <p className="stamp absolute bottom-5 left-6 max-lg:hidden" aria-hidden="true">
          {active + 1} / {features.length}
        </p>
      </div>
    </Tabs.Root>
  );
}

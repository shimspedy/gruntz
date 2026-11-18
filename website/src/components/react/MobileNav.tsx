import { Drawer } from 'vaul';
import { Menu, X } from 'lucide-react';

export interface MobileNavProps {
  links: { label: string; href: string }[];
  cta: { label: string; href: string };
  langs: { label: string; href: string; current: boolean; code: string }[];
  labels: { open: string; close: string; title: string; language: string };
}

/** Small-screen menu as a Vaul bottom sheet: drag to dismiss, focus trapped, Esc closes. */
export default function MobileNav({ links, cta, langs, labels }: MobileNavProps) {
  return (
    <Drawer.Root>
      <Drawer.Trigger aria-label={labels.open} className="inline-flex size-11 items-center justify-center rounded-full border border-bone/15 text-bone transition-colors duration-150 ease-out hover:bg-bone/5 lg:hidden">
        <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[20px] border-t border-bone/10 bg-ink-2 text-bone outline-none">
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-bone/20" />
          <div className="flex items-center justify-between px-6 pt-4">
            <Drawer.Title className="stamp">{labels.title}</Drawer.Title>
            <Drawer.Close aria-label={labels.close} className="inline-flex size-11 items-center justify-center rounded-full text-bone-2 hover:text-bone">
              <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
            </Drawer.Close>
          </div>
          <Drawer.Description className="sr-only">{labels.title}</Drawer.Description>
          <nav aria-label={labels.title} className="flex flex-col overflow-y-auto px-6 pb-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="display border-b border-bone/10 py-4 text-2xl">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-4 px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
            <div role="group" aria-label={labels.language} className="flex gap-1">
              {langs.map((l) => (
                <a key={l.code} href={l.href} hrefLang={l.code} lang={l.code} aria-current={l.current ? 'true' : undefined} className="stamp inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 aria-[current=true]:bg-bone/10 aria-[current=true]:text-bone">
                  {l.label}
                </a>
              ))}
            </div>
            <a href={cta.href} target="_blank" rel="noopener" className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-white">
              {cta.label}
            </a>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

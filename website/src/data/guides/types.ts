/**
 * Content model for the fitness-test and training guides.
 *
 * Text fields accept two inline marks, rendered by `inline()`:
 *   [label](/internal-or-https-url)   and   **strong**
 * Nothing else is interpreted; everything is HTML-escaped first.
 */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { type: 'note'; text: string };

export interface Section {
  /** Anchor id, kebab-case, unique within the guide. */
  id: string;
  title: string;
  blocks: Block[];
}

export interface Guide {
  /** Last path segment, e.g. 'army-aft'. No year in slugs. */
  slug: string;
  kind: 'test' | 'training';
  /** Short name for cards and breadcrumbs, e.g. 'Army AFT'. */
  name: string;
  /** Branch label for test guides, e.g. 'U.S. Army'. */
  branch?: string;
  /** <title>, 60 characters or fewer. */
  metaTitle: string;
  /** Meta description, 155 characters or fewer. */
  description: string;
  h1: string;
  /** One or two sentences under the H1. */
  lede: string;
  /** One line for index cards. */
  summary: string;
  /** ISO date the facts were last checked against the listed sources. */
  verified: string;
  /** Three to five at-a-glance facts shown beside the intro. */
  facts: { label: string; value: string }[];
  sections: Section[];
  faq: { q: string; a: string }[];
  /** Official or authoritative references. Test guides must list at least one. */
  sources: { label: string; url: string }[];
  /** Slugs of related guides, as 'fitness-tests/army-aft' or 'training/plank-training'. */
  related: string[];
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Render the two supported inline marks to HTML. Only https and root-relative links are allowed (not protocol-relative //host). */
export function inline(text: string): string {
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|\/(?!\/))[^)\s]*)\)/g, (_m, label: string, href: string) => {
      const external = href.startsWith('https://');
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
}

/** Strip inline marks, for JSON-LD and meta text. */
export function plain(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

export const guidePath = (g: Pick<Guide, 'kind' | 'slug'>) =>
  `/${g.kind === 'test' ? 'fitness-tests' : 'training'}/${g.slug}/`;

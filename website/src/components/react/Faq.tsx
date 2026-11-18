import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface FaqProps {
  items: { q: string; a: string }[];
}

/** FAQ list. Rendered at build time with every answer in the HTML, then made interactive in the browser. */
export default function Faq({ items }: FaqProps) {
  return (
    <Accordion type="single" collapsible className="border-t border-current/10">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`q${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>
            <p dangerouslySetInnerHTML={{ __html: item.a }} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

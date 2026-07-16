"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PoeHeading, SITE } from "./poe-ui";
import type { FaqItem } from "@/types/league-landing";

interface FaqAccordionProps {
  faq: FaqItem[];
  accentColor: string;
  labels: { heading: string; subheading: string };
}

export function FaqAccordion({ faq, accentColor, labels }: FaqAccordionProps) {
  if (faq.length === 0) return null;

  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
    >
      <div className="mb-8">
        <PoeHeading as="h2" className="text-2xl sm:text-3xl">
          {labels.heading}
        </PoeHeading>
        <p className="mt-2 text-sm" style={{ color: SITE.muted }}>
          {labels.subheading}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full max-w-3xl">
        {faq.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border-white/10"
          >
            {/* Number and question must be ONE child: AccordionTrigger is
                `flex justify-between`, so two children get shoved to opposite
                ends — the index landed at the far left with the question
                stranded mid-row. */}
            <AccordionTrigger className="text-left text-base hover:no-underline">
              <span className="flex items-baseline gap-3">
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="max-w-2xl whitespace-pre-line pl-8 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default FaqAccordion;

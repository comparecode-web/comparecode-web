"use client";

import { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: Array<FaqItem>;
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openItems, setOpenItems] = useState<Array<string>>([]);

  const toggleItem = (question: string) => {
    setOpenItems((current) => (
      current.includes(question)
        ? current.filter((item) => item !== question)
        : [...current, question]
    ));
  };

  return (
    <div className="divide-y divide-border-default rounded-lg border border-border-default bg-bg-primary">
      {items.map((item) => {
        const isOpen = openItems.includes(item.question);
        const panelId = `faq-${item.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => toggleItem(item.question)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                "flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-hover-overlay",
                isOpen && "bg-linear-to-r from-accent-primary/12 via-accent-primary/5 to-transparent"
              )}
            >
              <span className="flex min-h-8 items-center">{item.question}</span>
              <MdKeyboardArrowDown
                className={cn(
                  "shrink-0 text-xl text-text-secondary transition-transform duration-(--duration-medium)",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div id={panelId} className="px-4 py-4 text-sm leading-6 text-text-secondary">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

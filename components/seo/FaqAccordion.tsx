"use client";

import { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { SiGithub } from "react-icons/si";
import { cn } from "@/utils/uiHelpers";

export interface FaqItem {
  question: string;
  answer: string;
  links?: Array<{
    href: string;
    label: string;
  }>;
}

interface FaqAccordionProps {
  items: Array<FaqItem>;
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (question: string) => {
    setOpenItem((current) => current === question ? null : question);
  };

  return (
    <div className="divide-y divide-border-default overflow-hidden rounded-xl border border-border-default bg-bg-primary">
      {items.map((item) => {
        const isOpen = openItem === item.question;
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
            <div
              id={panelId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-(--duration-medium) ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-4 py-4 text-sm leading-6 text-text-secondary">
                  <p>{item.answer}</p>
                  {item.links && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-secondary px-2.5 py-1.5 text-xs font-semibold text-accent-primary transition-colors hover:bg-hover-overlay hover:text-accent-hover"
                        >
                          <SiGithub className="text-base" />
                          <span>{link.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

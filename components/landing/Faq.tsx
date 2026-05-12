"use client";

import React, { useState } from "react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqProps {
  items?: FaqItem[];
}

const defaultFaqItems: FaqItem[] = [
  {
    id: "faq-free",
    question: "Is AIStack Auditor really free?",
    answer:
      "Yes, completely free. You can run a full audit of your AI stack without creating an account or entering payment details. We may offer premium features in the future, but the core audit will always be free.",
  },
  {
    id: "faq-data",
    question: "What data do you collect and how is it stored?",
    answer:
      "We only collect the tool names and spend figures you enter during the audit. This data is used solely to generate your report and is never sold or shared with third parties. Reports are stored temporarily to enable sharing via a unique link.",
  },
  {
    id: "faq-accuracy",
    question: "How accurate are the cost and savings estimates?",
    answer:
      "Our pricing data is updated regularly from public sources. Savings estimates are based on typical usage patterns and publicly available pricing tiers. Actual savings will vary depending on your specific contracts and usage volumes.",
  },
  {
    id: "faq-tools",
    question: "Which AI tools does the auditor support?",
    answer:
      "We support the most widely used AI tools including OpenAI, Anthropic, GitHub Copilot, Midjourney, Jasper, Notion AI, and many more. If a tool you use isn't listed, you can still add it manually with a custom spend figure.",
  },
  {
    id: "faq-share",
    question: "Can I share my audit report with my team?",
    answer:
      "Yes. After completing your audit you'll receive a unique shareable link that anyone can view without needing an account. This makes it easy to present findings to stakeholders or discuss with your team.",
  },
];

interface FaqItemRowProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItemRow({ item, isOpen, onToggle }: FaqItemRowProps): React.ReactElement {
  const buttonId = `${item.id}-btn`;
  const answerId = `${item.id}-answer`;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-gray-900 transition-colors duration-150 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        >
          <span>{item.question}</span>
          <svg
            aria-hidden="true"
            className={[
              "h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200",
              isOpen ? "rotate-180" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </h3>

      <div
        id={answerId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="pb-5 text-sm leading-relaxed text-gray-600"
      >
        {item.answer}
      </div>
    </div>
  );
}

export function Faq({ items = defaultFaqItems }: FaqProps): React.ReactElement {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-labelledby="faq-heading"
      className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="faq-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about AIStack Auditor.
          </p>
        </div>

        <div
          className="mt-10 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white px-6 shadow-sm"
          role="list"
          aria-label="Frequently asked questions"
        >
          {items.map((item) => (
            <FaqItemRow
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

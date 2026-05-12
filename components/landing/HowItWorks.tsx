import React from "react";

export interface Step {
  number: number;
  title: string;
  description: string;
}

export interface HowItWorksProps {
  steps?: Step[];
}

const defaultSteps: Step[] = [
  {
    number: 1,
    title: "Enter Your AI Tools",
    description:
      "Select the AI tools and services your team currently uses and enter your monthly spend for each one.",
  },
  {
    number: 2,
    title: "We Analyse Your Stack",
    description:
      "Our engine checks for cost inefficiencies, overlapping capabilities, and better-value alternatives in seconds.",
  },
  {
    number: 3,
    title: "Get Your Audit Report",
    description:
      "Receive a detailed, shareable report with a health score, savings opportunities, and actionable recommendations.",
  },
];

export function HowItWorks({ steps = defaultSteps }: HowItWorksProps): React.ReactElement {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Three simple steps to a leaner, smarter AI stack.
          </p>
        </div>

        <ol
          role="list"
          className="mt-12 grid gap-8 sm:grid-cols-3"
          aria-label="Audit process steps"
        >
          {steps.map((step, index) => (
            <li key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-6 left-1/2 hidden h-0.5 w-full bg-blue-200 sm:block"
                  style={{ left: "50%", width: "100%" }}
                />
              )}

              {/* Step number circle */}
              <div
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-md"
                aria-hidden="true"
              >
                {step.number}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

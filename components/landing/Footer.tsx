import React from "react";
import Link from "next/link";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  brandName?: string;
  tagline?: string;
  linkGroups?: FooterLinkGroup[];
  legalLinks?: FooterLink[];
  copyrightYear?: number;
}

const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Start Audit", href: "/audit" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Features", href: "/#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Sample Report", href: "#" },
    ],
  },
];

const defaultLegalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export function Footer({
  brandName = "AIStack Auditor",
  tagline = "Helping teams spend smarter on AI.",
  linkGroups = defaultLinkGroups,
  legalLinks = defaultLegalLinks,
  copyrightYear = new Date().getFullYear(),
}: FooterProps): React.ReactElement {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-gray-200 bg-white px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={`${brandName} home`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                AI
              </span>
              {brandName}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-500">{tagline}</p>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <nav
              key={group.title}
              aria-label={`${group.title} links`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                {group.title}
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors duration-150 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {copyrightYear} {brandName}. All rights reserved.
          </p>

          {legalLinks.length > 0 && (
            <nav aria-label="Legal links">
              <ul role="list" className="flex flex-wrap gap-x-6 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors duration-150 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

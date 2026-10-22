'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitHubIcon, Mark, REPO_URL, Slash } from '@/components/brand';

const TABS = [
  { href: '/', label: 'Leads' },
  { href: '/how-it-works', label: 'How It Works' }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)]">
      <a
        href="#content"
        className="text-button-14 sr-only rounded-md bg-[var(--ds-background-100)] px-3 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:shadow-[var(--ds-focus-ring)]"
      >
        Skip to Content
      </a>
      <div className="mx-auto flex h-16 max-w-[var(--ds-page-width-wide)] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
          >
            <Mark />
            <span className="text-label-16 font-semibold tracking-[-0.32px]">Startup Scout</span>
          </Link>
          <Slash />
          <span className="text-label-14 truncate text-[var(--ds-gray-900)]">UK Startups</span>
          <span className="text-label-12 hidden h-5 items-center rounded-full bg-[var(--ds-gray-200)] px-2 sm:inline-flex">
            Demo
          </span>
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-button-14 flex h-8 shrink-0 items-center gap-2 rounded-md px-3 shadow-[var(--ds-shadow-border)] transition-colors duration-150 hover:bg-[var(--ds-gray-100)] focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">View Source</span>
          <span className="sr-only sm:hidden">View source on GitHub</span>
        </a>
      </div>
      <nav
        aria-label="Sections"
        className="mx-auto flex max-w-[var(--ds-page-width-wide)] gap-1 overflow-x-auto px-2 md:px-4"
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`text-label-14 relative flex h-10 shrink-0 items-center px-2 transition-colors duration-150 focus-visible:outline-none ${
                active
                  ? 'text-[var(--ds-gray-1000)]'
                  : 'text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)]'
              }`}
            >
              <span className="rounded-md px-1 py-1 [a:focus-visible_&]:shadow-[var(--ds-focus-ring)] [a:hover_&]:bg-[var(--ds-gray-alpha-100)]">
                {tab.label}
              </span>
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--ds-gray-1000)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { GitHubIcon, REPO_URL } from '@/components/brand';
import { DRAFT_MODEL } from '@/lib/drafts';

export const metadata: Metadata = {
  title: 'How It Works · Startup Scout'
};

const focusRing = 'focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none';

const STEPS = [
  {
    title: 'Find',
    body: 'Takes the newest active UK companies from the public YC directory, plus any domains you paste in.',
    uses: 'Code'
  },
  {
    title: 'Check',
    body: 'Reads response headers and HTML on the site and its app subdomain to name the host and framework.',
    uses: 'Code'
  },
  {
    title: 'Score',
    body: 'Adds up plain rules from 0 to 100, with a reason for every point. Sites already on Vercel drop out.',
    uses: 'Code'
  },
  {
    title: 'Research',
    body: 'Pulls founders, open roles and news from the company’s public YC page.',
    uses: 'Code'
  },
  {
    title: 'Draft',
    body: 'Writes an email, a LinkedIn note and a call opener from the observed facts only.',
    uses: 'AI SDK + AI Gateway'
  }
];

const RULES = [
  { signal: 'Runs Next.js on a host other than Vercel', points: '40' },
  { signal: 'Runs another modern JavaScript framework off Vercel', points: '15' },
  { signal: 'YC batch in the last 12 months', points: '20' },
  { signal: 'YC batch in the last 3 years', points: '10' },
  { signal: 'Hiring now', points: '15' },
  { signal: 'Team of 5 to 75 people', points: '10' },
  { signal: 'Builds AI products', points: '10' },
  { signal: 'Already on Vercel', points: 'Excluded' }
];

const META: { label: string; items: { text: string; href?: string; mono?: boolean }[] }[] = [
  { label: 'Built By', items: [{ text: 'Ayo Ahmed' }] },
  {
    label: 'Repository',
    items: [{ text: 'startup-scout', href: REPO_URL, mono: true }]
  },
  {
    label: 'Stack',
    items: [
      { text: 'Next.js 16' },
      { text: 'Workflow SDK' },
      { text: 'AI SDK' },
      { text: 'AI Gateway' },
      { text: 'Vercel Blob' },
      { text: 'BotID' }
    ]
  },
  { label: 'Model', items: [{ text: DRAFT_MODEL, mono: true }] },
  { label: 'Data', items: [{ text: 'YC directory' }, { text: 'Public web pages' }] },
  { label: 'License', items: [{ text: 'MIT', href: `${REPO_URL}/blob/main/LICENSE` }] }
];

export default function HowItWorks() {
  return (
    <div className="mx-auto grid max-w-[var(--ds-page-width)] grid-cols-1 gap-12 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-16 lg:col-span-9">
        <section className="flex flex-col gap-6">
          <h1 className="text-heading-40 md:text-heading-48 text-balance">
            The outbound half of a lead agent
          </h1>
          <p className="text-copy-18 max-w-[var(--ds-reading-width)] text-[var(--ds-gray-900)]">
            Vercel’s open-source Lead Agent qualifies the people who come to Vercel. Startup Scout
            started from that template and points it the other way: it finds UK startups that
            should hear from Vercel, shows the evidence, and drafts the first message. A person
            reviews every draft, and nothing is sent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className={`text-button-14 flex h-10 items-center rounded-full bg-[var(--ds-gray-1000)] px-5 text-[var(--ds-background-100)] transition-colors duration-150 hover:bg-[var(--ds-gray-1000)]/90 ${focusRing}`}
            >
              View Leads
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={`text-button-14 flex h-10 items-center gap-2 rounded-full px-5 shadow-[var(--ds-shadow-border)] transition-colors duration-150 hover:bg-[var(--ds-gray-100)] ${focusRing}`}
            >
              <GitHubIcon />
              View Source
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-heading-24">Pipeline</h2>
            <p className="text-copy-16 max-w-[var(--ds-reading-width)] text-[var(--ds-gray-900)]">
              One durable workflow. Every step retries and checkpoints, and only the last one uses
              a model.
            </p>
          </div>
          <ol className="material-base grid grid-cols-1 overflow-hidden md:grid-cols-5">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 border-[var(--ds-gray-alpha-400)] p-5 not-first:border-t md:not-first:border-t-0 md:not-first:border-l"
              >
                <span className="text-label-13-mono text-[var(--ds-gray-900)]">0{i + 1}</span>
                <h3 className="text-heading-16">{step.title}</h3>
                <p className="text-copy-14 flex-1 text-[var(--ds-gray-900)]">{step.body}</p>
                <span
                  className={`text-label-12 w-fit rounded-full px-2 py-0.5 ${
                    step.uses === 'Code'
                      ? 'bg-[var(--ds-gray-200)]'
                      : 'bg-[var(--ds-gray-1000)] text-[var(--ds-background-100)]'
                  }`}
                >
                  {step.uses}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-heading-24">Scoring</h2>
            <p className="text-copy-16 max-w-[var(--ds-reading-width)] text-[var(--ds-gray-900)]">
              Plain rules, so a person can check every point. Drafts are written only for leads
              with a stack signal from one of the first two rows.
            </p>
          </div>
          <div className="material-base overflow-hidden">
            <table className="w-full border-collapse">
              <caption className="sr-only">Scoring rules</caption>
              <thead>
                <tr className="text-label-13 border-b border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-200)] text-left text-[var(--ds-gray-900)]">
                  <th scope="col" className="h-10 px-4 font-normal">
                    Signal
                  </th>
                  <th scope="col" className="h-10 px-4 text-right font-normal">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {RULES.map((r) => (
                  <tr
                    key={r.signal}
                    className="text-label-14 border-t border-[var(--ds-gray-alpha-400)] first:border-t-0"
                  >
                    <td className="h-12 px-4">{r.signal}</td>
                    <td
                      className={`h-12 px-4 text-right tabular-nums ${
                        r.points === 'Excluded' ? 'text-[var(--ds-gray-900)]' : ''
                      }`}
                    >
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-3 lg:pt-2">
        {META.map((m) => (
          <div key={m.label} className="flex flex-col gap-1.5">
            <h2 className="text-label-14 font-medium">{m.label}</h2>
            <ul className="flex flex-col gap-1">
              {m.items.map((item) => (
                <li
                  key={item.text}
                  translate={item.mono ? 'no' : undefined}
                  className={`${item.mono ? 'text-label-13-mono' : 'text-label-14'} text-[var(--ds-gray-900)]`}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-sm hover:text-[var(--ds-gray-1000)] ${focusRing}`}
                    >
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}

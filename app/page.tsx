import Link from 'next/link';
import { GitHubIcon, Mark, REPO_URL } from '@/components/brand';
import { AsciiField, Radar, Scramble } from '@/components/ascii';
import { RunForm } from '@/components/run-form';
import { getRun, listLeads } from '@/lib/store';
import { Lead } from '@/lib/types';

export const dynamic = 'force-dynamic';

const focusRing = 'focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none';
const pillPrimary = `text-button-14 flex h-10 items-center gap-2 rounded-full bg-[var(--ds-gray-1000)] px-4 text-[var(--ds-background-100)] transition-colors duration-150 hover:bg-[var(--ds-gray-1000)]/90 ${focusRing}`;
const pillSecondary = `text-button-14 flex h-10 items-center gap-2 rounded-full px-4 shadow-[var(--ds-shadow-border)] transition-colors duration-150 hover:bg-[var(--ds-gray-100)] ${focusRing}`;

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Small line icons for the pipeline steps */
const ICONS: Record<string, React.ReactNode> = {
  find: <><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></>,
  check: <><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 6h12M5 9h3" /></>,
  score: <path d="M3 13V9M8 13V5M13 13V2" />,
  research: <><circle cx="8" cy="5.5" r="2.5" /><path d="M3 14c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" /></>,
  draft: <path d="M10.5 2.5 13.5 5.5 6 13H3v-3l7.5-7.5Z" />,
  review: <path d="M2 8.5 6 12.5 14 3.5" />
};

function StepIcon({ name }: { name: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

const STEPS = [
  {
    icon: 'find',
    title: 'Find the newest teams',
    body: 'Starts from the newest active UK companies in the public YC directory, plus any domains you paste in.'
  },
  {
    icon: 'check',
    title: 'Read the stack',
    body: 'Response headers and page HTML name the host and framework on the site and its app subdomain.'
  },
  {
    icon: 'score',
    title: 'Score with reasons',
    body: 'Plain rules from 0 to 100, with a reason for every point. Teams already on Vercel drop out.'
  },
  {
    icon: 'research',
    title: 'Know who to ask',
    body: 'Founders, open roles and recent news come from each company’s public YC page.'
  },
  {
    icon: 'draft',
    title: 'Draft from facts',
    body: 'An email, a LinkedIn note and a call opener, written by a model that sees only observed facts.'
  },
  {
    icon: 'review',
    title: 'Keep a human in the loop',
    body: 'Every draft waits for a person. Nothing is sent, and every claim links back to its evidence.'
  }
];

const RULES = [
  { points: '+40', signal: 'Runs Next.js on a host other than Vercel' },
  { points: '+20', signal: 'Joined YC in the last 12 months' },
  { points: '+15', signal: 'Runs another modern JavaScript framework off Vercel' },
  { points: '+15', signal: 'Hiring now' },
  { points: '+10', signal: 'Joined YC in the last 3 years' },
  { points: '+10', signal: 'Team of 5 to 75 people' },
  { points: '+10', signal: 'Builds AI products' },
  { points: '0', signal: 'Already on Vercel, so it is left out' }
];

function hostOf(lead: Lead) {
  const check = lead.site.reachable ? lead.site : lead.app;
  return check?.reachable ? check.host : 'Unknown';
}

function frameworkOf(lead: Lead) {
  const found = [lead.site, lead.app].find((c) => c?.reachable && c.framework !== 'Unknown');
  return found?.framework ?? null;
}

async function latest() {
  try {
    const run = await getRun();
    if (!run) return null;
    const leads = await listLeads(run.runId);
    return { run, leads };
  } catch {
    return null;
  }
}

export default async function Overview() {
  const data = await latest();
  const leads = data?.leads ?? [];
  const prospects = leads.filter((l) => !l.score.excluded);
  const top = prospects.slice(0, 5);
  const stats = [
    { value: leads.length, label: 'Startups checked' },
    { value: leads.filter((l) => l.status === 'excluded').length, label: 'Already on Vercel' },
    { value: prospects.length, label: 'Prospects' },
    { value: leads.filter((l) => l.drafts).length, label: 'Drafts written' }
  ];

  return (
    <div className="mx-auto flex max-w-[var(--ds-page-width-wide)] flex-col px-4 md:px-6">
      {/* Hero */}
      <section className="relative isolate flex flex-col gap-10 py-24 md:py-40 lg:flex-row lg:items-center lg:justify-between">
        <AsciiField className="pointer-events-none absolute inset-y-0 right-[-24px] -z-10 h-full w-full text-[var(--ds-gray-700)] opacity-25 [mask-image:radial-gradient(ellipse_at_right,black,transparent_70%)] md:w-2/3" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Radar cols={21} rows={21} className="size-28 shrink-0 md:size-32" />
          <div className="flex max-w-[52ch] flex-col gap-4">
            <Scramble as="h1" text="Startup Scout" className="font-mono-caps text-label-18" />
            <Scramble
              as="p"
              duration={1400}
              text="Finds UK startups that should hear from Vercel, shows the evidence, and drafts the first message."
              className="font-mono-caps text-label-18 leading-[1.4] text-[var(--ds-gray-900)]"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/leads" className={pillPrimary}>
            <Mark size={16} />
            View the Leads
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className={pillSecondary}>
            <GitHubIcon />
            View Source
          </a>
        </div>
      </section>

      {/* Latest run numbers */}
      <section
        aria-label="Latest run"
        className="flex flex-col gap-8 pb-24 md:pb-32 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-col items-start gap-4">
          <p className="font-mono-caps text-label-13 text-[var(--ds-gray-900)]">
            From the <span className="text-[var(--ds-gray-1000)]">latest run</span>
            <br />
            of the scout
          </p>
          <Link href="/leads" className={`${pillSecondary} h-8 text-button-14`}>
            See every lead
            <Arrow />
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4 lg:gap-x-20">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <Scramble as="dd" text={data ? String(s.value) : '—'} duration={900} className="font-pixel text-heading-48 tabular-nums" />
              <dt className="text-label-14 text-[var(--ds-gray-900)]">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Pipeline */}
      <section className="grid grid-cols-1 gap-12 pb-24 md:pb-40 lg:grid-cols-12">
        <div className="hidden text-[var(--ds-gray-1000)] lg:col-span-5 lg:block">
          <Radar mode="ascii" cols={52} rows={34} className="aspect-[52/34] w-full max-w-[520px] lg:sticky lg:top-40" />
        </div>
        <div className="flex flex-col gap-14 lg:col-span-7">
          <Scramble
            as="h2"
            text="From cold list → first message"
            className="font-pixel text-heading-40 md:text-heading-56 text-balance"
          />
          <ul className="grid grid-cols-1 gap-x-14 gap-y-12 sm:grid-cols-2">
            {STEPS.map((step) => (
              <li key={step.title} className="flex flex-col gap-3">
                <h3 className="font-mono-caps text-label-16 flex items-center gap-2">
                  <StepIcon name={step.icon} />
                  <Scramble text={step.title} />
                </h3>
                <p className="text-copy-16 max-w-[36ch] text-[var(--ds-gray-900)]">{step.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Statement */}
      <section className="pb-24 md:pb-40">
        <p className="text-copy-20 max-w-[60ch] text-[var(--ds-gray-900)]">
          Vercel’s open-source Lead Agent qualifies the people who come to Vercel. Startup Scout
          started from that template and points it outward: one durable workflow, plain-rule
          scoring, and a model used only for the final draft.
        </p>
      </section>

      {/* Scoring */}
      <section className="flex flex-col gap-12 pb-24 md:pb-40">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Scramble
            as="h2"
            text="Every point has a reason"
            className="font-pixel text-heading-40 md:text-heading-56 text-balance"
          />
          <a href={`${REPO_URL}/blob/main/lib/score.ts`} target="_blank" rel="noreferrer" className={`${pillSecondary} w-fit`}>
            Read the scoring code
            <Arrow />
          </a>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2">
          {RULES.map((rule, i) => (
            <li
              key={rule.signal}
              className={`flex flex-col gap-6 border-[var(--ds-gray-alpha-400)] py-10 md:py-12 ${
                i < RULES.length - 1 ? 'border-b' : ''
              } ${i === RULES.length - 2 ? 'md:border-b-0' : ''} ${
                i % 2 === 0 ? 'md:border-r md:pr-12' : 'md:pl-12'
              }`}
            >
              <Scramble
                text={rule.points}
                duration={900}
                className="font-pixel text-heading-48 text-[var(--ds-gray-700)] tabular-nums"
              />
              <p className="text-copy-24 max-w-[30ch]">{rule.signal}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Top prospects */}
      {top.length > 0 && (
        <section className="flex flex-col gap-12 pb-24 md:pb-40">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Scramble
              as="h2"
              text="Top prospects right now"
              className="font-pixel text-heading-40 md:text-heading-56 text-balance"
            />
            <Link href="/leads" className={`${pillSecondary} w-fit`}>
              View all leads
              <Arrow />
            </Link>
          </div>
          <ul className="flex flex-col">
            {top.map((lead) => {
              const framework = frameworkOf(lead);
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads?lead=${encodeURIComponent(lead.id)}`}
                    className={`group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 rounded-md py-6 md:grid-cols-12 ${focusRing}`}
                  >
                    <span className="text-label-16 md:col-span-2">{lead.name}</span>
                    <span className="text-copy-14 col-span-2 row-start-2 max-w-[44ch] text-[var(--ds-gray-900)] md:col-span-4 md:row-start-auto">
                      {lead.drafts?.whyNow ?? lead.oneLiner}
                    </span>
                    <span className="font-mono-caps text-label-12 hidden text-[var(--ds-gray-900)] md:col-span-3 md:block">
                      {[hostOf(lead), framework].filter(Boolean).join(', ')}
                    </span>
                    <Scramble
                      text={String(lead.score.total)}
                      hover
                      className="font-pixel text-heading-32 tabular-nums md:col-span-1 md:text-right"
                    />
                    <span className="font-mono-caps text-label-12 hidden items-center justify-end gap-1.5 text-[var(--ds-gray-900)] transition-colors duration-150 group-hover:text-[var(--ds-gray-1000)] md:col-span-2 md:flex">
                      <Scramble text="View lead" hover duration={400} />
                      <Arrow />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Run it */}
      <section className="relative isolate grid grid-cols-1 gap-12 pb-32 md:pb-48 lg:grid-cols-12">
        <AsciiField className="pointer-events-none absolute -bottom-px left-[-24px] -z-10 h-2/3 w-1/2 text-[var(--ds-gray-700)] opacity-30 [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Scramble
            as="h2"
            text="Run the scout on your own list"
            className="font-pixel text-heading-40 md:text-heading-48 text-balance"
          />
          <p className="text-copy-18 max-w-[40ch] text-[var(--ds-gray-900)]">
            Check the newest UK startups, or paste in the domains you care about. A full run takes
            about 30 seconds.
          </p>
        </div>
        <div className="lg:col-span-7">
          <RunForm />
        </div>
      </section>
    </div>
  );
}

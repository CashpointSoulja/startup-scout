'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AsciiSpinner, Radar, Scramble } from '@/components/ascii';
import { Chevron } from '@/components/run-form';
import { startScout } from '@/lib/start-scout';
import { Lead } from '@/lib/types';

type Run = {
  runId: string;
  startedAt: string;
  total: number;
  status: string;
};

const SIZES = [10, 25, 50];

const focusRing = 'focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none';

function hostLabel(lead: Lead) {
  const check = lead.site.reachable ? lead.site : lead.app;
  if (!check?.reachable) return '—';
  const label = check.hostIsCdn ? `${check.host} (CDN)` : check.host;
  return check.host !== 'Vercel' && lead.app?.host === 'Vercel' ? `${label}, app on Vercel` : label;
}

function frameworkLabel(lead: Lead) {
  const found = [lead.site, lead.app].find(
    (c) => c?.reachable && c.framework !== 'Unknown'
  );
  return found?.framework ?? '—';
}

const STATUS = {
  drafted: { label: 'Drafted', dot: 'bg-[var(--ds-blue-700)]' },
  scored: { label: 'Scored', dot: 'bg-[var(--ds-gray-700)]' },
  excluded: { label: 'On Vercel', dot: 'bg-[var(--ds-gray-500)]' },
  unreachable: { label: 'Unreachable', dot: 'bg-[var(--ds-amber-700)]' }
} as const;

function Status({ lead }: { lead: Lead }) {
  const { label, dot } = STATUS[lead.status];
  return (
    <span className="text-label-14 inline-flex items-center gap-2 whitespace-nowrap">
      <span className={`size-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function RunStatus({ status }: { status: string }) {
  const running = status === 'running' || status === 'pending';
  const done = status === 'completed';
  const dot = running
    ? 'bg-[var(--ds-amber-700)]'
    : done
      ? 'bg-[var(--ds-green-700)]'
      : status === 'failed'
        ? 'bg-[var(--ds-red-700)]'
        : 'bg-[var(--ds-gray-700)]';
  const label = running ? 'Running' : done ? 'Ready' : status === 'failed' ? 'Failed' : 'Finished';
  return (
    <span className="inline-flex items-center gap-2">
      {running ? (
        <AsciiSpinner className="w-2.5 text-[var(--ds-amber-900)]" />
      ) : (
        <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <span className="flex items-center justify-end gap-3">
      <span
        className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[var(--ds-gray-alpha-200)] sm:block"
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full bg-[var(--ds-gray-1000)]"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-6 text-right tabular-nums">{value}</span>
    </span>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" />
      <path
        d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"
        stroke="currentColor"
      />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 11 11 5M6 4.5h5.5V10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[var(--ds-gray-alpha-400)] pt-5">
      <h3 className="text-heading-14">{title}</h3>
      {children}
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type DraftTab = 'email' | 'linkedin' | 'call';

function Drafts({ lead }: { lead: Lead }) {
  const [tab, setTab] = useState<DraftTab>('email');
  const drafts = lead.drafts!;
  const tabs: { id: DraftTab; label: string; text: string }[] = [
    {
      id: 'email',
      label: 'Email',
      text: `Subject: ${drafts.emailSubject}\n\n${drafts.emailBody}`
    },
    { id: 'linkedin', label: 'LinkedIn Note', text: drafts.linkedinNote },
    { id: 'call', label: 'Call Opener', text: drafts.callOpener }
  ];
  const current = tabs.find((t) => t.id === tab)!;

  return (
    <Section title={`Drafts for ${drafts.persona}`}>
      <div className="material-base overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-200)] pr-2">
          <div role="tablist" aria-label="Draft type" className="flex min-w-0 overflow-x-auto px-1">
            {tabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`text-label-13 relative h-10 shrink-0 px-3 transition-colors duration-150 ${focusRing} ${
                    active
                      ? 'text-[var(--ds-gray-1000)]'
                      : 'text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)]'
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--ds-gray-1000)]" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label={`Copy ${current.label}`}
            className={`flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--ds-gray-900)] transition-colors duration-150 hover:bg-[var(--ds-gray-alpha-200)] hover:text-[var(--ds-gray-1000)] ${focusRing}`}
            onClick={async () => {
              await navigator.clipboard.writeText(current.text);
              toast(`${current.label} copied`);
            }}
          >
            <CopyIcon />
          </button>
        </div>
        <p role="tabpanel" className="text-copy-14 whitespace-pre-wrap p-4">
          {current.text}
        </p>
      </div>
      <p className="text-copy-13 text-[var(--ds-gray-900)]">
        Sample drafts, written the way a Vercel Startups BDR would send them. Nothing here is sent.
      </p>
    </Section>
  );
}

function LeadDetail({ lead }: { lead: Lead }) {
  const checks = [lead.site, lead.app].filter((c) => c?.reachable);
  const facts = [
    { label: 'Host', value: hostLabel(lead) },
    { label: 'Framework', value: frameworkLabel(lead) },
    { label: 'Batch', value: lead.batch ? `YC ${lead.batch}` : '—' },
    { label: 'Team', value: lead.teamSize ? `${lead.teamSize} people` : '—' },
    { label: 'Hiring', value: lead.isHiring ? 'Yes' : 'No' },
    { label: 'Location', value: lead.location ?? '—' }
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-heading-24 min-w-0 break-words">{lead.name}</h2>
          {!lead.score.excluded && (
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-heading-24 tabular-nums">{lead.score.total}</span>
              <span className="text-label-12 text-[var(--ds-gray-900)]">Score</span>
            </div>
          )}
        </div>
        {lead.oneLiner && (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">{lead.oneLiner}</p>
        )}
        <a
          className={`text-label-13-mono inline-flex w-fit items-center gap-1 rounded-sm text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)] ${focusRing}`}
          href={lead.website}
          target="_blank"
          rel="noreferrer"
          translate="no"
        >
          {lead.domain}
          <ArrowUpRight />
        </a>
      </div>

      {lead.drafts && (
        <div className="text-copy-14 rounded-md border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-200)] p-3">
          <strong>Why Now:</strong> {lead.drafts.whyNow}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {facts.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-label-13 text-[var(--ds-gray-900)]">{f.label}</dt>
            <dd className="text-label-14 truncate">{f.value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Score">
        {lead.score.excluded ? (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">{lead.score.excluded}.</p>
        ) : (
          <ul className="flex flex-col">
            {lead.score.reasons.map((r) => (
              <li key={r.label} className="text-label-14 flex justify-between gap-3 py-1">
                <span>{r.label}</span>
                <span className="tabular-nums text-[var(--ds-gray-900)]">+{r.points}</span>
              </li>
            ))}
            <li className="text-label-14 mt-1 flex justify-between gap-3 border-t border-dashed border-[var(--ds-gray-alpha-400)] pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{lead.score.total}</span>
            </li>
          </ul>
        )}
      </Section>

      <Section title="Evidence">
        {checks.length === 0 && (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">No response from the site.</p>
        )}
        {checks.map((c) => (
          <div key={c!.url} className="flex min-w-0 flex-col gap-2">
            <p className="text-label-14 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-label-13-mono truncate" translate="no">
                {c!.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
              <span className="text-[var(--ds-gray-900)]">
                {c!.host} · {c!.framework}
              </span>
            </p>
            {c!.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {c!.evidence.map((e) => (
                  <code
                    key={e}
                    translate="no"
                    className="text-label-12-mono rounded-sm bg-[var(--ds-gray-alpha-100)] px-1.5 py-0.5 shadow-[0_0_0_1px_var(--ds-gray-alpha-300)]"
                  >
                    {e}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      {lead.research && lead.research.contacts.length > 0 && (
        <Section title="People">
          <ul className="flex flex-col gap-3">
            {lead.research.contacts.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="text-label-12 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ds-gray-200)] font-medium"
                >
                  {initials(c.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-label-14 truncate">{c.name}</span>
                  <span className="text-label-13 truncate text-[var(--ds-gray-900)]">
                    {c.title}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lead.research && lead.research.jobs.length > 0 && (
        <Section title="Open Roles">
          <ul className="flex flex-col gap-1">
            {lead.research.jobs.slice(0, 5).map((j) => (
              <li key={j.title} className="text-label-14 truncate">
                {j.title}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lead.drafts ? (
        <Drafts key={lead.id} lead={lead} />
      ) : (
        !lead.score.excluded && (
          <Section title="Drafts">
            <p className="text-copy-14 text-[var(--ds-gray-900)]">
              Drafts are written only for top leads with a stack signal: a modern JavaScript
              framework running somewhere other than Vercel.
            </p>
          </Section>
        )
      )}
    </div>
  );
}

function EmptyState({ running }: { running: boolean }) {
  return (
    <div className="material-base flex flex-col items-center gap-2 px-6 py-16 text-center">
      {running && <Radar mode="ascii" cols={30} rows={18} className="mb-4 aspect-[30/18] w-64" />}
      <h2 className="text-heading-16">{running ? 'Checking Sites…' : 'No Leads Yet'}</h2>
      <p className="text-copy-14 max-w-[44ch] text-[var(--ds-gray-900)]">
        {running
          ? 'Leads appear here as each site is checked. A full run takes about 30 seconds.'
          : 'Run Scout to check the newest UK startups from the YC directory.'}
      </p>
    </div>
  );
}

type View = 'prospects' | 'all';

export function Scout() {
  const [size, setSize] = useState(25);
  const [domains, setDomains] = useState('');
  const [run, setRun] = useState<Run | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [view, setView] = useState<View>('prospects');

  const refresh = useCallback(async () => {
    const { run } = (await fetch('/api/scout').then((r) => r.json())) as { run: Run | null };
    setRun(run);
    if (!run) return;
    const { leads } = (await fetch(`/api/leads?runId=${run.runId}`).then((r) => r.json())) as {
      leads: Lead[];
    };
    setLeads(leads);
  }, []);

  const running = run?.status === 'running' || run?.status === 'pending';

  useEffect(() => {
    const lead = new URLSearchParams(window.location.search).get('lead');
    if (lead) setSelectedId(lead);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [running, refresh]);

  const visible = useMemo(
    () => (view === 'all' ? leads : leads.filter((l) => !l.score.excluded)),
    [leads, view]
  );

  const selected = useMemo(
    () => visible.find((l) => l.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId]
  );

  const drafted = leads.filter((l) => l.drafts).length;
  const onVercel = leads.filter((l) => l.status === 'excluded').length;

  async function startRun(e: React.FormEvent) {
    e.preventDefault();
    setStarting(true);
    try {
      const runId = await startScout(size, domains);
      setRun({ runId, startedAt: new Date().toISOString(), total: size, status: 'running' });
      setLeads([]);
      setSelectedId(null);
      toast('Scout started');
    } catch (err) {
      toast(`Couldn’t start the scout. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setStarting(false);
    }
  }

  const summary = run
    ? [
        { label: 'Status', value: <RunStatus status={running ? 'running' : run.status} /> },
        {
          label: 'Checked',
          value: (
            <span className="tabular-nums">
              {leads.length} of {run.total}
            </span>
          )
        },
        { label: 'Drafted', value: <span className="tabular-nums">{drafted}</span> },
        { label: 'Already on Vercel', value: <span className="tabular-nums">{onVercel}</span> },
        { label: 'Source', value: 'YC directory' },
        {
          label: 'Run',
          value: (
            <span className="text-label-14-mono" translate="no">
              {run.runId.slice(-8).toLowerCase()}
            </span>
          )
        }
      ]
    : [];

  return (
    <>
      <div className="border-b border-[var(--ds-gray-alpha-400)]">
        <div className="mx-auto flex max-w-[var(--ds-page-width-wide)] flex-col gap-8 px-4 py-10 md:px-6">
          <div className="flex flex-col gap-2">
            <Scramble as="h1" text="Leads" className="font-pixel text-heading-48 text-balance" />
            <p className="text-copy-16 max-w-[var(--ds-reading-width)] text-[var(--ds-gray-900)]">
              UK startups running a modern framework somewhere other than Vercel, ranked by why
              they need it now. Each lead gets a first message for a person to review.
            </p>
          </div>

          <form onSubmit={startRun} className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex flex-col gap-2">
              <span className="text-label-13 text-[var(--ds-gray-900)]">Companies</span>
              <span className="relative flex">
              <select
                name="companies"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={`text-copy-16 md:text-label-14 h-10 rounded-md bg-[var(--ds-background-100)] px-3 shadow-[var(--ds-shadow-border)] hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-500)] w-full md:h-9 md:w-28 appearance-none pr-9 ${focusRing}`}
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Chevron />
              </span>
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-label-13 text-[var(--ds-gray-900)]">Extra Domains</span>
              <input
                name="domains"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="acme.ai, example.co.uk"
                autoComplete="off"
                spellCheck={false}
                className={`text-copy-16 md:text-label-14 h-10 rounded-md bg-[var(--ds-background-100)] px-3 shadow-[var(--ds-shadow-border)] placeholder:text-[var(--ds-gray-700)] hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-500)] md:h-9 ${focusRing}`}
              />
            </label>
            <button
              type="submit"
              disabled={starting || running}
              className={`text-button-14 flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--ds-gray-1000)] px-4 text-[var(--ds-background-100)] transition-colors duration-150 hover:bg-[var(--ds-gray-1000)]/90 disabled:cursor-not-allowed disabled:bg-[var(--ds-gray-100)] disabled:text-[var(--ds-gray-700)] disabled:shadow-[var(--ds-shadow-border)] md:h-9 ${focusRing}`}
            >
              {(starting || running) && <AsciiSpinner />}
              {starting ? 'Starting…' : running ? 'Scouting…' : 'Run Scout'}
            </button>
          </form>

          {run && (
            <dl
              aria-live="polite"
              className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {summary.map((s) => (
                <div key={s.label} className="flex min-w-0 flex-col gap-1">
                  <dt className="font-mono-caps text-label-12 text-[var(--ds-gray-900)]">{s.label}</dt>
                  <dd className="text-label-14">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-[var(--ds-page-width-wide)] flex-col gap-4 px-4 py-8 md:px-6">
        {leads.length === 0 ? (
          <EmptyState running={running} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="radiogroup"
                aria-label="Show"
                className="flex h-9 items-center gap-1 rounded-md bg-[var(--ds-background-100)] p-1 shadow-[var(--ds-shadow-border)]"
              >
                {(
                  [
                    ['prospects', 'Prospects'],
                    ['all', 'All Companies']
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={view === id}
                    onClick={() => {
                      setView(id);
                      setSelectedId(null);
                    }}
                    className={`text-label-14 h-7 rounded-sm px-3 transition-colors duration-150 ${focusRing} ${
                      view === id
                        ? 'bg-[var(--ds-gray-200)] text-[var(--ds-gray-1000)]'
                        : 'text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-label-14 text-[var(--ds-gray-900)]">
                <span className="tabular-nums">{visible.length}</span>{' '}
                {visible.length === 1 ? 'company' : 'companies'}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="material-base min-w-0 overflow-x-auto lg:col-span-7">
                <table className="w-full min-w-[600px] border-collapse">
                  <caption className="sr-only">
                    Companies checked in this run, highest score first
                  </caption>
                  <thead>
                    <tr className="text-label-13 border-b border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-200)] text-left text-[var(--ds-gray-900)]">
                      <th scope="col" className="h-10 px-4 font-normal">
                        Company
                      </th>
                      <th scope="col" className="h-10 px-3 font-normal">
                        Host
                      </th>
                      <th scope="col" className="h-10 px-3 font-normal">
                        Framework
                      </th>
                      <th scope="col" className="h-10 px-3 text-right font-normal">
                        Score
                      </th>
                      <th scope="col" className="h-10 px-4 font-normal">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((lead) => {
                      const isSelected = selected?.id === lead.id;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedId(lead.id)}
                          className={`text-label-14 cursor-pointer border-t border-[var(--ds-gray-alpha-400)] transition-colors duration-150 first:border-t-0 ${
                            isSelected
                              ? 'bg-[var(--ds-gray-100)]'
                              : 'hover:bg-[var(--ds-gray-alpha-100)]'
                          }`}
                        >
                          <td className="relative h-14 px-4">
                            {isSelected && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-0.5 bg-[var(--ds-gray-1000)]"
                              />
                            )}
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              className={`flex flex-col rounded-sm text-left ${focusRing}`}
                              onClick={() => setSelectedId(lead.id)}
                            >
                              <span className="font-medium">{lead.name}</span>
                              <span className="text-label-13 text-[var(--ds-gray-900)]">
                                {lead.batch ?? lead.domain}
                              </span>
                            </button>
                          </td>
                          <td className="h-14 px-3">{hostLabel(lead)}</td>
                          <td className="h-14 px-3">{frameworkLabel(lead)}</td>
                          <td className="h-14 px-3 text-right">
                            {lead.score.excluded ? (
                              <span className="text-[var(--ds-gray-900)]">—</span>
                            ) : (
                              <ScoreBar value={lead.score.total} />
                            )}
                          </td>
                          <td className="h-14 px-4">
                            <Status lead={lead} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <aside
                aria-label="Lead details"
                className="material-base min-w-0 p-5 md:p-6 lg:sticky lg:top-[124px] lg:col-span-5 lg:max-h-[calc(100dvh-148px)] lg:overflow-y-auto"
              >
                {selected ? (
                  <LeadDetail lead={selected} />
                ) : (
                  <p className="text-copy-14 text-[var(--ds-gray-900)]">
                    No prospects in this run. Show all companies to see the rest.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}

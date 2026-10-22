'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Lead } from '@/lib/types';

type Run = {
  runId: string;
  startedAt: string;
  total: number;
  status: string;
};

const SIZES = [10, 25, 50];

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

function StatusBadge({ lead }: { lead: Lead }) {
  const label = {
    drafted: 'Drafted',
    scored: 'Scored',
    excluded: 'On Vercel',
    unreachable: 'Unreachable'
  }[lead.status];
  const warn = lead.status === 'unreachable';
  return (
    <span
      className={`text-label-12 inline-flex h-5 items-center rounded-full px-2 ${
        warn
          ? 'bg-[var(--ds-amber-100)] text-[var(--ds-amber-900)]'
          : 'bg-[var(--ds-gray-200)] text-[var(--ds-gray-1000)]'
      }`}
    >
      {label}
    </span>
  );
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-label-14 font-semibold">{label}</h4>
        <button
          type="button"
          className="text-button-12 h-7 rounded-md px-2 shadow-[var(--ds-shadow-border)] hover:bg-[var(--ds-gray-100)] focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            toast(`${label} copied`);
          }}
        >
          Copy {label}
        </button>
      </div>
      <p className="text-copy-14 whitespace-pre-wrap rounded-md bg-[var(--ds-background-200)] p-3 shadow-[var(--ds-shadow-border)]">
        {text}
      </p>
    </div>
  );
}

function LeadDetail({ lead }: { lead: Lead }) {
  const checks = [lead.site, lead.app].filter((c) => c?.reachable);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-heading-20">{lead.name}</h2>
          <span className="text-heading-20 tabular-nums">{lead.score.total}</span>
        </div>
        {lead.oneLiner && (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">{lead.oneLiner}</p>
        )}
        <a
          className="text-label-13-mono w-fit text-[var(--ds-gray-900)] underline-offset-4 hover:underline"
          href={lead.website}
          target="_blank"
          rel="noreferrer"
        >
          {lead.domain}
        </a>
      </div>

      {lead.drafts && (
        <p className="text-copy-14 rounded-md bg-[var(--ds-blue-100)] p-3 text-[var(--ds-blue-900)] shadow-[0_0_0_1px_var(--ds-blue-400)]">
          <strong>Why now:</strong> {lead.drafts.whyNow}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-heading-14">Score</h3>
        {lead.score.excluded ? (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">{lead.score.excluded}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {lead.score.reasons.map((r) => (
              <li key={r.label} className="text-copy-14 flex justify-between gap-3">
                <span>{r.label}</span>
                <span className="tabular-nums text-[var(--ds-gray-900)]">+{r.points}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-heading-14">Evidence</h3>
        {checks.length === 0 && (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">No response from the site.</p>
        )}
        {checks.map((c) => (
          <div key={c!.url} className="flex flex-col gap-1">
            <p className="text-copy-14">
              <span className="text-label-13-mono">{c!.url}</span> · {c!.host} ·{' '}
              {c!.framework}
            </p>
            {c!.evidence.length > 0 && (
              <p className="text-copy-13 text-[var(--ds-gray-900)]">
                {c!.evidence.map((e) => (
                  <code key={e} className="text-label-12-mono mr-2">
                    {e}
                  </code>
                ))}
              </p>
            )}
          </div>
        ))}
      </section>

      {lead.research && lead.research.contacts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-heading-14">People</h3>
          <ul className="flex flex-col gap-1">
            {lead.research.contacts.map((c) => (
              <li key={c.name} className="text-copy-14">
                {c.name} <span className="text-[var(--ds-gray-900)]">· {c.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lead.research && lead.research.jobs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-heading-14">Open Roles</h3>
          <ul className="flex flex-col gap-1">
            {lead.research.jobs.slice(0, 5).map((j) => (
              <li key={j.title} className="text-copy-14">
                {j.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lead.drafts ? (
        <section className="flex flex-col gap-4">
          <h3 className="text-heading-14">Drafts for {lead.drafts.persona}</h3>
          <p className="text-copy-13 text-[var(--ds-gray-900)]">
            Sample drafts, written as a Vercel Startups BDR would send them. Ayo Ahmed does not
            work at Vercel, and nothing here is sent.
          </p>
          <CopyBlock
            label="Email"
            text={`Subject: ${lead.drafts.emailSubject}\n\n${lead.drafts.emailBody}`}
          />
          <CopyBlock label="LinkedIn Note" text={lead.drafts.linkedinNote} />
          <CopyBlock label="Call Opener" text={lead.drafts.callOpener} />
        </section>
      ) : (
        !lead.score.excluded && (
          <p className="text-copy-14 text-[var(--ds-gray-900)]">
            Drafts are written only for the top leads with a stack signal (a modern JS framework off Vercel).
          </p>
        )
      )}
    </div>
  );
}

export function Scout() {
  const [size, setSize] = useState(25);
  const [domains, setDomains] = useState('');
  const [run, setRun] = useState<Run | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [running, refresh]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? leads[0] ?? null,
    [leads, selectedId]
  );

  const drafted = leads.filter((l) => l.drafts).length;

  async function startRun(e: React.FormEvent) {
    e.preventDefault();
    setStarting(true);
    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          limit: size,
          domains: domains
            .split(/[\s,]+/)
            .map((d) => d.trim())
            .filter(Boolean)
        })
      });
      const body = (await res.json()) as { runId?: string; error?: string };
      if (!res.ok || !body.runId) throw new Error(body.error ?? `Status ${res.status}`);
      setRun({ runId: body.runId, startedAt: new Date().toISOString(), total: size, status: 'running' });
      setLeads([]);
      setSelectedId(null);
      toast('Scout started');
    } catch (err) {
      toast(`Couldn’t start the scout. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-8 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-32">Startup Scout</h1>
        <p className="text-copy-16 max-w-[64ch] text-[var(--ds-gray-900)]">
          Finds UK startups running Next.js somewhere other than Vercel, scores why they need it
          now, and drafts the first message. Nothing is sent.
        </p>
      </header>

      <form
        onSubmit={startRun}
        className="flex flex-col gap-3 md:flex-row md:items-end"
      >
        <label className="flex flex-col gap-1">
          <span className="text-label-13 text-[var(--ds-gray-900)]">Companies</span>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="text-copy-16 md:text-copy-14 h-9 rounded-md border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)] px-2 focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-label-13 text-[var(--ds-gray-900)]">Extra Domains</span>
          <input
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="acme.ai, example.co.uk"
            className="text-copy-16 md:text-copy-14 h-9 rounded-md border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)] px-3 focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={starting || running}
          className="text-button-14 h-9 rounded-md bg-[var(--ds-gray-1000)] px-4 text-[var(--ds-background-100)] transition-opacity duration-150 hover:opacity-90 focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none disabled:opacity-50"
        >
          {starting ? 'Starting…' : running ? 'Scouting…' : 'Run Scout'}
        </button>
      </form>

      {run && (
        <p className="text-copy-14 text-[var(--ds-gray-900)]" aria-live="polite">
          <span className="tabular-nums">
            {leads.length} of {run.total}
          </span>{' '}
          checked · <span className="tabular-nums">{drafted}</span> drafted ·{' '}
          {running ? 'running' : run.status} · run{' '}
          <span className="text-label-13-mono">{run.runId.slice(-8)}</span>
        </p>
      )}

      {leads.length === 0 ? (
        <p className="text-copy-14 text-[var(--ds-gray-900)]">
          {running ? 'Checking sites…' : 'No leads yet. Run Scout to check the newest UK startups.'}
        </p>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="min-w-0 overflow-x-auto lg:col-span-7">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="text-label-13 text-left text-[var(--ds-gray-900)]">
                  <th className="py-2 pr-3 font-normal">Company</th>
                  <th className="py-2 pr-3 font-normal">Host</th>
                  <th className="py-2 pr-3 font-normal">Framework</th>
                  <th className="py-2 pr-3 text-right font-normal">Score</th>
                  <th className="py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedId(lead.id)}
                    className={`text-copy-14 cursor-pointer border-t border-[var(--ds-gray-alpha-400)] hover:bg-[var(--ds-gray-100)] ${
                      selected?.id === lead.id ? 'bg-[var(--ds-gray-100)]' : ''
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        className="text-left focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
                        onClick={() => setSelectedId(lead.id)}
                      >
                        <span className="font-medium">{lead.name}</span>
                        {lead.batch && (
                          <span className="text-[var(--ds-gray-900)]"> · {lead.batch}</span>
                        )}
                      </button>
                    </td>
                    <td className="py-2 pr-3">{hostLabel(lead)}</td>
                    <td className="py-2 pr-3">{frameworkLabel(lead)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {lead.score.excluded ? '—' : lead.score.total}
                    </td>
                    <td className="py-2">
                      <StatusBadge lead={lead} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="material-base min-w-0 p-4 md:p-6 lg:col-span-5 lg:self-start">
            {selected && <LeadDetail lead={selected} />}
          </aside>
        </div>
      )}

      <footer className="text-copy-13 flex flex-col gap-1 border-t border-[var(--ds-gray-alpha-400)] pt-4 text-[var(--ds-gray-900)]">
        <p>
          Built by Ayo Ahmed as an independent project; not affiliated with Vercel. Public sources
          only: the YC company directory and public web pages. Drafts are for human review;
          nothing is sent.
        </p>
        <p>
          Vercel, the Vercel design, Next.js and related marks, designs and logos are trademarks or
          registered trademarks of Vercel, Inc. or its affiliates in the US and other countries.
        </p>
      </footer>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { startScout } from '@/lib/start-scout';

const SIZES = [10, 25, 50];

export function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--ds-gray-900)]"
    >
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const field =
  'text-copy-16 md:text-label-14 h-10 w-full rounded-md bg-[var(--ds-background-200)] px-3 shadow-[var(--ds-shadow-border)] placeholder:text-[var(--ds-gray-700)] hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-500)] focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none';

/**
 * Overview form: start a run, then hand over to the leads page, which polls it
 */
export function RunForm() {
  const router = useRouter();
  const [size, setSize] = useState(25);
  const [domains, setDomains] = useState('');
  const [starting, setStarting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStarting(true);
    try {
      await startScout(size, domains);
      toast('Scout started');
      router.push('/leads');
    } catch (err) {
      toast(`Couldn’t start the scout. ${err instanceof Error ? err.message : ''}`);
      setStarting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-label-14 text-[var(--ds-gray-900)]">Companies</span>
        <span className="relative flex">
          <select
            name="companies"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className={`${field} appearance-none pr-9`}
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s} newest UK startups
              </option>
            ))}
          </select>
          <Chevron />
        </span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-label-14 text-[var(--ds-gray-900)]">Source</span>
        <input value="YC company directory" readOnly className={`${field} text-[var(--ds-gray-900)]`} />
      </label>
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-label-14 text-[var(--ds-gray-900)]">Extra Domains</span>
        <textarea
          name="domains"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          placeholder="acme.ai, example.co.uk"
          rows={4}
          spellCheck={false}
          className={`${field} h-auto resize-y py-2.5`}
        />
      </label>
      <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <p className="text-copy-13 max-w-[60ch] text-[var(--ds-gray-900)]">
          Public sources only. One run at a time, and drafts are samples for review. Nothing is sent.
        </p>
        <button
          type="submit"
          disabled={starting}
          className="text-button-14 flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--ds-gray-1000)] px-5 text-[var(--ds-background-100)] transition-colors duration-150 hover:bg-[var(--ds-gray-1000)]/90 focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none disabled:opacity-60"
        >
          {starting ? 'Starting…' : 'Run Scout'}
        </button>
      </div>
    </form>
  );
}

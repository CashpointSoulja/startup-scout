export const REPO_URL = 'https://github.com/CashpointSoulja/startup-scout';

/**
 * The product's own mark: a scope ring with a dot
 */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function Slash() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="text-[var(--ds-gray-alpha-400)]"
    >
      <path d="M10.5 2.5 5.5 13.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}


export function Footer() {
  return (
    <footer className="border-t border-[var(--ds-gray-alpha-400)]">
      <div className="mx-auto flex max-w-[var(--ds-page-width-wide)] flex-col gap-4 px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mark size={18} />
            <span className="text-label-14 font-medium">Startup Scout</span>
            <span className="text-label-14 text-[var(--ds-gray-900)]">by Ayo Ahmed</span>
          </div>
          <div className="text-label-14 flex items-center gap-4 text-[var(--ds-gray-900)]">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm hover:text-[var(--ds-gray-1000)] focus-visible:shadow-[var(--ds-focus-ring)] focus-visible:outline-none"
            >
              GitHub
            </a>
            <span>Hosted on Vercel</span>
          </div>
        </div>
        <p className="text-copy-13 max-w-[var(--ds-reading-width)] text-[var(--ds-gray-900)]">
          An independent project, not affiliated with Vercel. Public sources only. Drafts are
          samples for human review, and nothing is sent. Vercel, the Vercel design, Next.js and
          related marks, designs and logos are trademarks or registered trademarks of Vercel, Inc.
          or its affiliates in the US and other countries.
        </p>
      </div>
    </footer>
  );
}

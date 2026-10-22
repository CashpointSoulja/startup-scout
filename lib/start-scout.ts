/**
 * Starts a scout run from the browser. Shared by the overview form and the leads page.
 */
export async function startScout(limit: number, domains: string) {
  const res = await fetch('/api/scout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      limit,
      domains: domains
        .split(/[\s,]+/)
        .map((d) => d.trim())
        .filter(Boolean)
    })
  });
  const body = (await res.json()) as { runId?: string; error?: string };
  if (!res.ok || !body.runId) throw new Error(body.error ?? `Status ${res.status}`);
  return body.runId;
}

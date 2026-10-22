import { Company, Research } from '@/lib/types';

type YcPageProps = {
  company?: { founders?: { full_name?: string; title?: string }[] };
  jobPostings?: { title?: string; roleSpecificType?: string; prettyRole?: string }[];
  newsItems?: { title?: string; url?: string }[];
};

const decodeEntities = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * Read founders, open roles and news from the company's public YC page.
 * The page embeds its data as JSON, so no model is needed and nothing is guessed.
 */
export async function researchFromYc(company: Company): Promise<Research | null> {
  if (!company.ycUrl) return null;

  const res = await fetch(company.ycUrl, {
    headers: { 'user-agent': 'StartupScout/1.0 (prospecting research)' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!res.ok) return null;

  const match = (await res.text()).match(/data-page="([^"]+)"/);
  if (!match) return null;

  const props = (JSON.parse(decodeEntities(match[1])) as { props?: YcPageProps }).props ?? {};

  return {
    contacts: (props.company?.founders ?? [])
      .filter((f) => f.full_name)
      .map((f) => ({ name: f.full_name!, title: f.title ?? 'Founder' })),
    jobs: (props.jobPostings ?? [])
      .filter((j) => j.title)
      .map((j) => ({ title: j.title!, type: j.roleSpecificType ?? j.prettyRole ?? '' })),
    news: (props.newsItems ?? [])
      .filter((n) => n.title)
      .slice(0, 5)
      .map((n) => ({ title: n.title!, url: n.url ?? null }))
  };
}

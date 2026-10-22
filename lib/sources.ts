import { Company } from '@/lib/types';

const YC_COMPANIES_URL = 'https://yc-oss.github.io/api/companies/all.json';

type YcCompany = {
  name: string;
  slug: string;
  website: string | null;
  one_liner: string | null;
  batch: string | null;
  team_size: number | null;
  isHiring: boolean;
  tags: string[] | null;
  status: string;
  regions: string[] | null;
  all_locations: string | null;
  url: string | null;
};

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];

/**
 * "Summer 2025" -> 2025.5, so newer batches sort first
 */
export function batchRank(batch: string | null): number {
  if (!batch) return 0;
  const [season, year] = batch.split(' ');
  const index = SEASONS.indexOf(season);
  if (!Number(year) || index === -1) return 0;
  return Number(year) + index / SEASONS.length;
}

export function toDomain(input: string): string | null {
  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Active UK companies from the public YC directory, newest batches first
 */
export async function fetchYcUk(limit: number): Promise<Company[]> {
  const res = await fetch(YC_COMPANIES_URL);
  if (!res.ok) throw new Error(`YC directory returned ${res.status}`);
  const all = (await res.json()) as YcCompany[];

  return all
    .filter(
      (c) =>
        c.status === 'Active' &&
        c.website &&
        (c.regions ?? []).includes('United Kingdom')
    )
    .sort((a, b) => batchRank(b.batch) - batchRank(a.batch))
    .flatMap((c): Company[] => {
      const domain = toDomain(c.website!);
      if (!domain) return [];
      return [
        {
          id: domain,
          name: c.name,
          domain,
          website: `https://${domain}`,
          oneLiner: c.one_liner ?? '',
          batch: c.batch,
          teamSize: c.team_size,
          isHiring: c.isHiring,
          tags: c.tags ?? [],
          location: c.all_locations,
          ycUrl: c.url,
          source: 'yc'
        }
      ];
    })
    .slice(0, limit);
}

/**
 * Domains pasted on the page, with only what we can know from the domain
 */
export function manualCompanies(domains: string[]): Company[] {
  return domains.flatMap((input): Company[] => {
    const domain = toDomain(input.trim());
    if (!domain) return [];
    return [
      {
        id: domain,
        name: domain,
        domain,
        website: `https://${domain}`,
        oneLiner: '',
        batch: null,
        teamSize: null,
        isHiring: false,
        tags: [],
        location: null,
        ycUrl: null,
        source: 'manual'
      }
    ];
  });
}

import { batchRank } from '@/lib/sources';
import { Company, Score, ScoreReason, StackCheck } from '@/lib/types';

const MODERN_JS = ['Nuxt', 'Astro', 'SvelteKit', 'Remix', 'Gatsby'];
const AI_TAGS = ['AI', 'Artificial Intelligence', 'Generative AI', 'AI Assistant', 'Machine Learning'];

/**
 * Plain rules, so every point has a reason a person can check
 */
export function scoreLead(
  company: Company,
  site: StackCheck,
  app: StackCheck | null,
  now = new Date()
): Score {
  const checks = [site, app].filter((c): c is StackCheck => c?.reachable ?? false);

  if (checks.some((c) => c.host === 'Vercel')) {
    return { total: 0, reasons: [], stackSignal: false, excluded: 'Already on Vercel' };
  }
  if (checks.length === 0) {
    return { total: 0, reasons: [], stackSignal: false, excluded: 'Site unreachable' };
  }

  const reasons: ScoreReason[] = [];
  const next = checks.find((c) => c.framework === 'Next.js');
  const modern = checks.find((c) => MODERN_JS.includes(c.framework));

  if (next) {
    const where = next.hostIsCdn ? `behind ${next.host}` : `on ${next.host}`;
    reasons.push({ points: 40, label: `Runs Next.js ${where}` });
  } else if (modern) {
    reasons.push({ points: 15, label: `Runs ${modern.framework} on ${modern.host}` });
  }

  const age = now.getFullYear() + now.getMonth() / 12 - batchRank(company.batch);
  if (company.batch && age <= 1) {
    reasons.push({ points: 20, label: `YC ${company.batch}` });
  } else if (company.batch && age <= 3) {
    reasons.push({ points: 10, label: `YC ${company.batch}` });
  }

  if (company.isHiring) {
    reasons.push({ points: 15, label: 'Hiring now' });
  }

  if (company.teamSize && company.teamSize >= 5 && company.teamSize <= 75) {
    reasons.push({ points: 10, label: `${company.teamSize}-person team` });
  }

  if (company.tags.some((t) => AI_TAGS.includes(t))) {
    reasons.push({ points: 10, label: 'Builds AI products' });
  }

  const total = Math.min(
    100,
    reasons.reduce((sum, r) => sum + r.points, 0)
  );
  return { total, reasons, stackSignal: Boolean(next || modern), excluded: null };
}

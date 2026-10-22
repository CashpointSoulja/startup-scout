import { writeDrafts } from '@/lib/drafts';
import { researchFromYc } from '@/lib/research';
import { scoreLead } from '@/lib/score';
import { fetchYcUk, manualCompanies } from '@/lib/sources';
import { checkStack } from '@/lib/stack';
import { saveLead, saveRun } from '@/lib/store';
import { Company, Lead, ScoutInput } from '@/lib/types';

/**
 * step to build the list of companies: pasted domains first, then YC UK
 */
export const stepFindCompanies = async (input: ScoutInput, runId: string) => {
  'use step';

  const manual = manualCompanies(input.domains);
  const yc = await fetchYcUk(Math.max(0, input.limit - manual.length));
  const seen = new Set<string>();
  const companies = [...manual, ...yc].filter((c) => !seen.has(c.id) && seen.add(c.id));

  await saveRun({ runId, startedAt: new Date().toISOString(), total: companies.length });
  return companies;
};

/**
 * step to check the site and app subdomain, then score with plain rules
 */
export const stepCheckAndScore = async (company: Company, runId: string) => {
  'use step';

  const site = await checkStack(company.website);
  const appCheck = await checkStack(`https://app.${company.domain}`);
  const app =
    appCheck.reachable &&
    (appCheck.status ?? 500) < 500 &&
    new URL(appCheck.url).hostname.endsWith(company.domain)
      ? appCheck
      : null;
  const score = scoreLead(company, site, app);

  const lead: Lead = {
    ...company,
    site,
    app,
    score,
    research: null,
    drafts: null,
    status:
      score.excluded === 'Already on Vercel'
        ? 'excluded'
        : score.excluded
          ? 'unreachable'
          : 'scored',
    runId,
    updatedAt: new Date().toISOString()
  };
  await saveLead(lead);
  return lead;
};

/**
 * step to read founders, open roles and news from the public YC page
 */
export const stepResearch = async (lead: Lead) => {
  'use step';

  const research = await researchFromYc(lead).catch(() => null);
  const updated: Lead = { ...lead, research, updatedAt: new Date().toISOString() };
  await saveLead(updated);
  return updated;
};

/**
 * step to draft the email, LinkedIn note and call opener
 */
export const stepDraft = async (lead: Lead) => {
  'use step';

  const drafts = await writeDrafts(lead);
  const updated: Lead = {
    ...lead,
    drafts,
    status: 'drafted',
    updatedAt: new Date().toISOString()
  };
  await saveLead(updated);
  return updated;
};

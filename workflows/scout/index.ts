import { getWorkflowMetadata } from 'workflow';
import { ScoutInput } from '@/lib/types';
import {
  stepCheckAndScore,
  stepDraft,
  stepFindCompanies,
  stepResearch
} from './steps';

/**
 * workflow to find outbound leads
 * - build the company list (pasted domains + YC UK)
 * - check hosting and framework for every company, in parallel, and score it
 * - for the top scorers with a stack signal (Next.js or another modern JS framework off Vercel):
 *   - read founders, open roles and news from the YC page
 *   - draft outreach for a human to review (nothing is sent)
 */
export const workflowScout = async (input: ScoutInput) => {
  'use workflow';

  const { workflowRunId } = getWorkflowMetadata();

  const companies = await stepFindCompanies(input, workflowRunId);
  const leads = await Promise.all(
    companies.map((company) => stepCheckAndScore(company, workflowRunId))
  );

  const top = leads
    .filter((lead) => !lead.score.excluded && lead.score.stackSignal)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, input.draftTop);

  await Promise.all(
    top.map(async (lead) => stepDraft(await stepResearch(lead)))
  );

  return { checked: leads.length, drafted: top.length };
};

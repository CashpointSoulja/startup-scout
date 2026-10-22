import { generateText, Output } from 'ai';
import { Drafts, draftsSchema, Lead } from '@/lib/types';

export const DRAFT_MODEL = 'anthropic/claude-sonnet-5.5';

const SYSTEM = `You write first-touch outreach for a Business Development Representative on Vercel's Startups team in London.

Rules:
- Use ONLY the facts in the FACTS block. Never invent numbers, customers, funding, quotes, product names or pain points.
- No guesses about what they want, feel or plan (no "likely", "probably", "I imagine").
- Lead with the single strongest observed fact (for example: "your site runs Next.js on AWS").
- Connect it to one relevant Vercel benefit in plain words: preview deployments per pull request, Fluid compute, the AI SDK and AI Gateway for AI products, or the Startups program. Pick the one the facts support.
- Plain UK English. No hype words (revolutionary, game-changing, supercharge, unlock). No exclamation marks. No em dashes.
- One ask only: a 15-minute call.
- Address the named founder or technical lead if one is given; otherwise address the role.
- Sign emails with the sender name only.`;

/**
 * Facts the code observed, so the model has nothing to guess
 */
function facts(lead: Lead) {
  const checks = [lead.site, lead.app].filter((c) => c?.reachable);
  return {
    company: lead.name,
    whatTheyDo: lead.oneLiner || null,
    ycBatch: lead.batch,
    teamSize: lead.teamSize,
    hiring: lead.isHiring,
    openRoles: lead.research?.jobs.map((j) => j.title) ?? [],
    recentNews: lead.research?.news.map((n) => n.title) ?? [],
    people: lead.research?.contacts ?? [],
    stack: checks.map((c) => ({
      url: c!.url,
      host: c!.hostIsCdn ? `${c!.host} (CDN in front; origin unknown)` : c!.host,
      framework: c!.framework
    })),
    scoreReasons: lead.score.reasons.map((r) => r.label)
  };
}

export async function writeDrafts(lead: Lead): Promise<Drafts> {
  const sender = process.env.SENDER_NAME || 'Ayo';
  const { output } = await generateText({
    model: DRAFT_MODEL,
    system: SYSTEM,
    output: Output.object({ schema: draftsSchema }),
    prompt: `SENDER: ${sender}\n\nFACTS:\n${JSON.stringify(facts(lead), null, 2)}`
  });
  return output;
}

import { z } from 'zod';

/**
 * A company we might prospect, before any checks
 */
export type Company = {
  id: string;
  name: string;
  domain: string;
  website: string;
  oneLiner: string;
  batch: string | null;
  teamSize: number | null;
  isHiring: boolean;
  tags: string[];
  location: string | null;
  ycUrl: string | null;
  source: 'yc' | 'manual';
};

/**
 * What one URL told us about its hosting and framework
 */
export type StackCheck = {
  url: string;
  reachable: boolean;
  status: number | null;
  host: string;
  hostIsCdn: boolean;
  framework: string;
  evidence: string[];
};

export type ScoreReason = { points: number; label: string };

export type Score = {
  total: number;
  reasons: ScoreReason[];
  stackSignal: boolean;
  excluded: string | null;
};

/**
 * Run input from the page
 */
export const scoutInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(25),
  domains: z.array(z.string().min(3).max(253)).max(25).default([]),
  draftTop: z.number().int().min(0).max(10).default(10)
});

export type ScoutInput = z.infer<typeof scoutInputSchema>;

/**
 * Facts read from the company's public YC page
 */
export type Contact = { name: string; title: string };
export type Job = { title: string; type: string };
export type NewsItem = { title: string; url: string | null };

export type Research = {
  contacts: Contact[];
  jobs: Job[];
  news: NewsItem[];
};

/**
 * AI output
 */
export const draftsSchema = z.object({
  whyNow: z
    .string()
    .describe('One sentence: the observed reason this startup should hear from Vercel now'),
  persona: z.string().describe('Who to contact: a named person and role, or a role'),
  emailSubject: z.string().describe('Under 8 words, no clickbait'),
  emailBody: z.string().describe('Under 90 words, one ask, signed with the sender name'),
  linkedinNote: z.string().describe('Under 300 characters'),
  callOpener: z.string().describe('Two sentences then one open question')
});

export type Drafts = z.infer<typeof draftsSchema>;

/**
 * A company after the workflow has checked it
 */
export type Lead = Company & {
  site: StackCheck;
  app: StackCheck | null;
  score: Score;
  research: Research | null;
  drafts: Drafts | null;
  status: 'scored' | 'drafted' | 'excluded' | 'unreachable';
  runId: string;
  updatedAt: string;
};

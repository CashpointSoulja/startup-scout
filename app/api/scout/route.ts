import { checkBotId } from 'botid/server';
import { getRun as getWorkflowRun, start } from 'workflow/api';
import { scoutInputSchema } from '@/lib/types';
import { getRun, saveRun } from '@/lib/store';
import { workflowScout } from '@/workflows/scout';

export async function POST(request: Request) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const parsedBody = scoutInputSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  const latest = await getRun();
  if (latest) {
    const status = await getWorkflowRun(latest.runId).status.catch(() => 'unknown');
    if (status === 'running' || status === 'pending') {
      return Response.json({ error: 'A scout is already running.' }, { status: 409 });
    }
  }

  const run = await start(workflowScout, [parsedBody.data]);

  // record the run now so the page starts polling it; the first step fills in the exact total
  await saveRun({
    runId: run.runId,
    startedAt: new Date().toISOString(),
    total: parsedBody.data.limit
  });

  return Response.json({ runId: run.runId }, { status: 200 });
}

/**
 * latest run and its status, for the page's progress line
 */
export async function GET() {
  const latest = await getRun();
  if (!latest) return Response.json({ run: null });

  const status = await getWorkflowRun(latest.runId)
    .status.catch(() => 'unknown');

  return Response.json({ run: { ...latest, status } });
}

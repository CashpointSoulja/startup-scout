import { listLeads } from '@/lib/store';

export async function GET(request: Request) {
  const runId = new URL(request.url).searchParams.get('runId') ?? undefined;
  const leads = await listLeads(runId);

  return Response.json({ leads });
}

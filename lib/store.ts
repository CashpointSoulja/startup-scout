import { get, list, put } from '@vercel/blob';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Lead } from '@/lib/types';

/**
 * One JSON file per lead, so parallel workflow steps never overwrite each other.
 * Vercel Blob on deployments, a local .data folder in development
 * (so local test runs never mix with the live site's runs).
 */

export type RunMeta = {
  runId: string;
  startedAt: string;
  total: number;
};

const useBlob = () => Boolean(process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN);
const LOCAL_DIR = path.join(process.cwd(), '.data');

async function writeJson(key: string, value: unknown) {
  const body = JSON.stringify(value, null, 2);
  if (useBlob()) {
    await put(key, body, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

async function readJson<T>(key: string): Promise<T | null> {
  if (useBlob()) {
    const result = await get(key, { access: 'private', useCache: false }).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    return (await new Response(result.stream).json()) as T;
  }
  try {
    return JSON.parse(await readFile(path.join(LOCAL_DIR, key), 'utf8')) as T;
  } catch {
    return null;
  }
}

async function listKeys(prefix: string): Promise<string[]> {
  if (useBlob()) {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor });
      keys.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return keys;
  }
  try {
    const files = await readdir(path.join(LOCAL_DIR, prefix));
    return files.filter((f) => f.endsWith('.json')).map((f) => `${prefix}${f}`);
  } catch {
    return [];
  }
}

export const saveLead = (lead: Lead) => writeJson(`leads/${lead.id}.json`, lead);

export const getLead = (id: string) => readJson<Lead>(`leads/${id}.json`);

export async function listLeads(runId?: string): Promise<Lead[]> {
  const keys = await listKeys('leads/');
  const leads = await Promise.all(keys.map((k) => readJson<Lead>(k)));
  return leads
    .filter((l): l is Lead => l !== null && (!runId || l.runId === runId))
    .sort((a, b) => b.score.total - a.score.total);
}

export const saveRun = (run: RunMeta) => writeJson('runs/latest.json', run);

export const getRun = () => readJson<RunMeta>('runs/latest.json');

import { runTurn } from './llm';
import type { Settings } from './types';

type Fetch = typeof fetch;

/** GET {baseUrl}/models (OpenAI-compatible). Returns sorted unique model ids. */
export async function listModels(s: Pick<Settings, 'baseUrl' | 'apiKey'>, f: Fetch = fetch, signal?: AbortSignal): Promise<string[]> {
  const url = s.baseUrl.replace(/\/+$/, '') + '/models';
  let res: Response;
  try {
    res = await f(url, { headers: s.apiKey ? { Authorization: `Bearer ${s.apiKey}` } : {}, signal });
  } catch (e: any) {
    throw new Error(`无法连接 ${url}：${e?.message ?? e}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}：${(await res.text().catch(() => '')).slice(0, 200)}`);
  const body: any = await res.json().catch(() => { throw new Error('返回的不是 JSON'); });
  const arr: any[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : [];
  const ids = arr.map((m) => (typeof m === 'string' ? m : m?.id ?? m?.name)).filter((x): x is string => typeof x === 'string' && !!x);
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

export interface TestResult { ok: boolean; ms: number; reply?: string; error?: string }

/** Send a tiny completion through the same pi durable path the extension uses. */
export async function testConnection(s: Settings, now: () => number = () => performance.now()): Promise<TestResult> {
  const t0 = now();
  try {
    const reply = await runTurn({ ...s, mock: false }, 'Reply with exactly: pong', [], 'ping');
    return { ok: true, ms: Math.round(now() - t0), reply: reply.slice(0, 80) };
  } catch (e: any) {
    return { ok: false, ms: Math.round(now() - t0), error: String(e?.message ?? e) };
  }
}

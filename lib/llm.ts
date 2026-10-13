import type { Settings } from './types';

type Msg = { role: string; content: string };

function endpoint(s: Settings) { return s.baseUrl.replace(/\/+$/, '') + '/chat/completions'; }
function headers(s: Settings) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (s.apiKey) h.Authorization = `Bearer ${s.apiKey}`;
  return h;
}

export async function complete(s: Settings, messages: Msg[], json = true): Promise<string> {
  const body: any = { model: s.model, messages, temperature: 0.3 };
  if (json) body.response_format = { type: 'json_object' };
  let res = await fetch(endpoint(s), { method: 'POST', headers: headers(s), body: JSON.stringify(body) });
  if (!res.ok && json && res.status === 400) {
    delete body.response_format; // some providers don't support response_format
    res = await fetch(endpoint(s), { method: 'POST', headers: headers(s), body: JSON.stringify(body) });
  }
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function stream(s: Settings, messages: Msg[], onDelta: (t: string) => void, signal?: AbortSignal) {
  const res = await fetch(endpoint(s), {
    method: 'POST', headers: headers(s), signal,
    body: JSON.stringify({ model: s.model, messages, stream: true, temperature: 0.5 }),
  });
  if (!res.ok || !res.body) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const d = l.slice(5).trim();
      if (d === '[DONE]') return;
      try { const t = JSON.parse(d).choices?.[0]?.delta?.content; if (t) onDelta(t); } catch { /* partial */ }
    }
  }
}

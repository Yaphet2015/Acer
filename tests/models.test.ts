import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listModels, testConnection } from '../lib/models';

let server: Server; let base = '';
beforeAll(async () => {
  server = createServer((req, res) => {
    const authed = req.headers.authorization === 'Bearer good';
    if (req.url === '/v1/models' && req.method === 'GET') {
      if (!authed) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end('{"error":"bad key"}'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ object: 'list', data: [{ id: 'gpt-b' }, { id: 'gpt-a' }, { id: 'gpt-a' }, { nope: 1 }] }));
    }
    if (req.url === '/v1/chat/completions') {
      let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
        const body = JSON.parse(raw);
        if (!authed) { res.writeHead(401); return res.end('{"error":{"message":"invalid key"}}'); }
        if (body.model === 'missing') { res.writeHead(404); return res.end('{"error":{"message":"model not found"}}'); }
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.write(`data: ${JSON.stringify({ id: '1', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta: { content: 'pong' }, finish_reason: null }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ id: '1', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`);
        res.end('data: [DONE]\n\n');
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/v1`;
});
afterAll(() => server.close());

describe('listModels', () => {
  it('returns sorted unique ids (trailing slash ok)', async () => {
    expect(await listModels({ baseUrl: base + '/', apiKey: 'good' })).toEqual(['gpt-a', 'gpt-b']);
  });
  it('surfaces HTTP errors', async () => {
    await expect(listModels({ baseUrl: base, apiKey: 'bad' })).rejects.toThrow(/401/);
  });
  it('surfaces network errors', async () => {
    await expect(listModels({ baseUrl: 'http://127.0.0.1:1/v1', apiKey: 'x' })).rejects.toThrow(/无法连接/);
  });
});

describe('testConnection', () => {
  it('succeeds with latency and reply', async () => {
    const r = await testConnection({ baseUrl: base, apiKey: 'good', model: 'gpt-a', mock: false });
    expect(r.ok).toBe(true); expect(r.reply).toBe('pong'); expect(r.ms).toBeGreaterThanOrEqual(0);
  });
  it('reports errors (bad key, unknown model)', async () => {
    const a = await testConnection({ baseUrl: base, apiKey: 'bad', model: 'gpt-a', mock: false });
    expect(a.ok).toBe(false); expect(a.error).toBeTruthy();
    const b = await testConnection({ baseUrl: base, apiKey: 'good', model: 'missing', mock: false });
    expect(b.ok).toBe(false); expect(b.error).toBeTruthy();
  });
});
